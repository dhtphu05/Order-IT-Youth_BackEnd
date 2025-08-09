export default {
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false, // Set to true only for development
  logging: ["query", "error"],
  entities: ["src/entities/**/*.ts"],
  migrations: ["src/migration/**/*.ts"],
  subscribers: ["src/subscriber/**/*.ts"],
    cli: {
      entitiesDir: "src/entities",
      migrationsDir: "src/migration",
      subscribersDir: "src/subscriber"
    }
  };