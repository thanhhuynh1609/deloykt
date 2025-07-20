# Only import pymysql for MySQL databases
import os
if 'mysql' in os.getenv('DATABASE_URL', '').lower():
    try:
        import pymysql
        pymysql.install_as_MySQLdb()
    except ImportError:
        pass
