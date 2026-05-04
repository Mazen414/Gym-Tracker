const sql = require('mssql'); 

const config = {
    server: 'localhost\\SQLEXPRESS', 
    database: 'GymTrackerDB',
    driver: 'msnodesqlv8', // This tells mssql to use Windows Auth
    options: {
        trustedConnection: true, 
        trustServerCertificate: true
    }
};

async function connectDB() {
    try {
        const pool = await sql.connect(config);
        console.log('Successfully connected to SQL Server using Windows Authentication!');
        return pool;
    } catch (err) {
        console.error('Database connection failed: ', err);
    }
}

module.exports = {
    sql,
    connectDB
};