export const dbConfig = {
  host: 'localhost',
  user: 'root', // Change this to your MySQL username
  password: 'root', // Change this to your MySQL password
  database: 'radiant_zebra_twirl',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00'
};

export const jwtSecret = 'your_super_secret_jwt_key_change_this_in_production';
