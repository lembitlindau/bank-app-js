#!/bin/bash

# ========================================================
# ANDMEBAASI TÄIELIK SEADISTAMISE SKRIPT
# Internetipanga MySQL andmebaasi automaatne ülesseadmine
# ========================================================

set -e  # Peata vea korral

# Värvide definitsioonid
RED='\033[0;31m'
GREEN='\033[0;32m'  
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logimise funktsioon
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# ========================================================
# SEADISTUSED
# ========================================================

DB_NAME="bank_app"
DB_HOST="localhost"
DB_PORT="3306"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# MySQL root kasutaja andmed
read -p "Sisesta MySQL root kasutajanimi [root]: " MYSQL_ROOT_USER
MYSQL_ROOT_USER=${MYSQL_ROOT_USER:-root}

read -s -p "Sisesta MySQL root parool: " MYSQL_ROOT_PASS
echo

# Kontrolli, kas MySQL teenus töötab
check_mysql_service() {
    log "Kontrollin MySQL teenuse olekut..."
    
    if ! systemctl is-active --quiet mysql && ! systemctl is-active --quiet mysqld; then
        warning "MySQL teenus ei tööta. Proovin käivitada..."
        
        if command -v systemctl >/dev/null; then
            sudo systemctl start mysql || sudo systemctl start mysqld || {
                error "MySQL teenuse käivitamine ebaõnnestus"
                exit 1
            }
        else
            error "Systemctl ei ole saadaval. Palun käivita MySQL käsitsi."
            exit 1
        fi
    fi
    
    log "MySQL teenus töötab ✓"
}

# Kontrolli MySQL ühendust
test_mysql_connection() {
    log "Testin MySQL ühendust..."
    
    if ! mysql -h"$DB_HOST" -P"$DB_PORT" -u"$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASS" -e "SELECT 1;" >/dev/null 2>&1; then
        error "MySQL ühendus ebaõnnestus. Kontrolli kasutajanime ja parooli."
        exit 1
    fi
    
    log "MySQL ühendus edukas ✓"
}

# Käivita SQL skript
execute_sql_script() {
    local script_file="$1"
    local description="$2"
    
    if [[ ! -f "$script_file" ]]; then
        error "Skript ei leitud: $script_file"
        return 1
    fi
    
    log "Käivitan: $description"
    info "Fail: $script_file"
    
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASS" < "$script_file"; then
        log "✓ $description - edukalt lõpetatud"
    else
        error "✗ $description - ebaõnnestus"
        return 1
    fi
}

# Kontrolli, kas andmebaas eksisteerib
check_database_exists() {
    local db_exists=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASS" \
        -e "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='$DB_NAME';" \
        --skip-column-names --silent)
    
    if [[ -n "$db_exists" ]]; then
        warning "Andmebaas '$DB_NAME' juba eksisteerib!"
        read -p "Kas tahad selle kustutada ja uuesti luua? [y/N]: " confirm
        
        if [[ $confirm =~ ^[Yy]$ ]]; then
            log "Kustutan olemasoleva andmebaasi..."
            mysql -h"$DB_HOST" -P"$DB_PORT" -u"$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASS" \
                -e "DROP DATABASE IF EXISTS $DB_NAME;"
            log "Andmebaas kustutatud ✓"
        else
            warning "Katkestan paigaldamise."
            exit 0
        fi
    fi
}

# Kontrolli vajalike failide olemasolu
check_required_files() {
    log "Kontrollin vajalike failide olemasolu..."
    
    local required_files=(
        "01_create_database.sql"
        "02_create_tables.sql" 
        "03_create_triggers_procedures.sql"
        "04_create_users_permissions.sql"
        "05_insert_sample_data.sql"
        "06_backup_restore_procedures.sql"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$SCRIPT_DIR/$file" ]]; then
            error "Nõutav fail ei leitud: $file"
            exit 1
        fi
        info "✓ $file"
    done
    
    log "Kõik nõutavad failid leitud ✓"
}

# Näita paigaldamise kokkuvõtet
show_installation_summary() {
    log "PAIGALDAMISE KOKKUVÕTE"
    info "========================"
    info "Andmebaas: $DB_NAME"
    info "Host: $DB_HOST:$DB_PORT"
    info "Kasutaja: $MYSQL_ROOT_USER"
    info "Skriptide kataloog: $SCRIPT_DIR"
    info "========================"
    
    read -p "Kas jätkata paigaldamisega? [Y/n]: " confirm
    if [[ $confirm =~ ^[Nn]$ ]]; then
        warning "Paigaldamine katkestatud kasutaja poolt."
        exit 0
    fi
}

# Loo andmebaasi varukoopia kataloog
create_backup_directory() {
    local backup_dir="/backups/bank_app"
    
    log "Loon varukoopia kataloogi..."
    
    if sudo mkdir -p "$backup_dir" 2>/dev/null; then
        log "✓ Varukoopia kataloog loodud: $backup_dir"
        sudo chown mysql:mysql "$backup_dir" 2>/dev/null || true
    else
        warning "Varukoopia kataloogi loomine ebaõnnestus. Jätkan ilma selleta."
    fi
}

# Kontrolli andmebaasi terviklust pärast paigaldamist
verify_installation() {
    log "Kontrollin paigaldamise terviklust..."
    
    # Kontrolli tabelite olemasolu
    local table_count=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASS" \
        -D"$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME';" \
        --skip-column-names --silent)
    
    if [[ $table_count -ge 7 ]]; then
        log "✓ Tabelid loodud edukalt ($table_count tabelit)"
    else
        error "✗ Tabelite arv on vale (oodatud: ≥7, leitud: $table_count)"
        return 1
    fi
    
    # Kontrolli kasutajate olemasolu
    local user_count=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASS" \
        -e "SELECT COUNT(*) FROM mysql.user WHERE User LIKE 'bank_%';" \
        --skip-column-names --silent)
    
    if [[ $user_count -ge 5 ]]; then
        log "✓ Andmebaasi kasutajad loodud edukalt ($user_count kasutajat)"
    else
        error "✗ Kasutajate arv on vale (oodatud: ≥5, leitud: $user_count)"
        return 1
    fi
    
    # Kontrolli näidisandmete olemasolu
    local sample_users=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASS" \
        -D"$DB_NAME" -e "SELECT COUNT(*) FROM users;" \
        --skip-column-names --silent)
    
    if [[ $sample_users -gt 0 ]]; then
        log "✓ Näidisandmed lisatud edukalt ($sample_users kasutajat)"
    else
        warning "Näidisandmeid ei leitud"
    fi
    
    log "Andmebaasi paigaldamine lõpetatud edukalt! 🎉"
}

# Näita kasutamisjuhiseid
show_usage_instructions() {
    log "KASUTAMISJUHISED"
    info "================"
    info ""
    info "1. Andmebaasiga ühendamine:"
    info "   mysql -u bank_app -p $DB_NAME"
    info "   Parool: AppSecure2025!"
    info ""
    info "2. Varukoopia loomine:"
    info "   mysqldump -u bank_backup -p $DB_NAME > backup.sql"
    info "   Parool: BackupSecure2025!"
    info ""
    info "3. Testpäringute käivitamine:"
    info "   mysql -u bank_app -p $DB_NAME < 07_sample_queries.sql"
    info ""
    info "4. Dokumentatsioon:"
    info "   Vaata: $SCRIPT_DIR/ANDMEBAASI_DOKUMENTATSIOON.md"
    info ""
    info "5. ER-diagramm:"
    info "   Vaata: $SCRIPT_DIR/ER_DIAGRAM_TEXT.sql"
    info ""
    info "================"
}

# ========================================================
# PEAMINE PROGRAMMI VOOG
# ========================================================

main() {
    log "🚀 INTERNETIPANGA ANDMEBAASI PAIGALDAMISE KÄIVITAMINE"
    log "======================================================"
    
    # Eelkontrollid
    check_mysql_service
    test_mysql_connection
    check_required_files
    show_installation_summary
    check_database_exists
    
    # Paigaldamise sammud
    log "🔧 ALUSTAME ANDMEBAASI PAIGALDAMIST..."
    
    execute_sql_script "$SCRIPT_DIR/01_create_database.sql" "Andmebaasi loomine"
    execute_sql_script "$SCRIPT_DIR/02_create_tables.sql" "Tabelite loomine"
    execute_sql_script "$SCRIPT_DIR/03_create_triggers_procedures.sql" "Triggerite ja protseduuride loomine"
    execute_sql_script "$SCRIPT_DIR/04_create_users_permissions.sql" "Kasutajate ja õiguste seadistamine"
    execute_sql_script "$SCRIPT_DIR/05_insert_sample_data.sql" "Näidisandmete lisamine"
    execute_sql_script "$SCRIPT_DIR/06_backup_restore_procedures.sql" "Varukoopia protseduuride loomine"
    
    # Paigaldamisjärgsed toimingud
    create_backup_directory
    verify_installation
    show_usage_instructions
    
    log "✅ ANDMEBAASI PAIGALDAMINE LÕPETATUD EDUKALT!"
    log "Andmebaas '$DB_NAME' on valmis kasutamiseks."
}

# Käivita peamine funktsioon
main "$@"
