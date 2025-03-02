const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const AWS = require('aws-sdk');
const mysql = require('mysql2'); // Keeping MySQL for local queries if needed

const app = express();

// Initialize AWS Lambda
const lambda = new AWS.Lambda({
  region: "ap-south-1" // Change to your AWS region
});

// MySQL Client connection (optional: if you still need direct MySQL queries)
const db = mysql.createConnection({
  host: 'new-ec2-rds.cpo8kcc8k41h.ap-south-1.rds.amazonaws.com', // Replace with your RDS endpoint
  user: 'admin', // Replace with your RDS DB username
  password: 'Ball81098', // Replace with your RDS DB password
  database: 'newec2rds', // Replace with your DB name
  port: 3306, // MySQL default port
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('✅ Connected to MySQL database');
});

// Define GraphQL Schema
const typeDefs = gql`
  type Query {
    getUser(id: Int!): User
  }

  type User {
    id: Int
    name: String
  }
`;

// Resolvers - Fetching data via AWS Lambda instead of direct MySQL
const resolvers = {
  Query: {
    getUser: async (_, { id }) => {
      try {
        const params = {
          FunctionName: "my_lambda_01", // Replace with actual Lambda function name
          InvocationType: "RequestResponse",
          Payload: JSON.stringify({ id }) // Sending user ID as payload
        };

        const response = await lambda.invoke(params).promise();
        return JSON.parse(response.Payload);
      } catch (error) {
        console.error("❌ Error invoking Lambda:", error);
        throw new Error("Failed to fetch user from Lambda");
      }
    },
  },
};

// Initialize Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });

  app.listen(4000, '0.0.0.0', () => {
    console.log('🚀 Server running on http://localhost:4000/graphql');
  });
}

startServer();

