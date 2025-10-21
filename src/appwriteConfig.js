// src/appwriteConfig.js
import { Client, Account } from 'appwrite';

const client = new Client();

client
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // Your Appwrite Endpoint
    .setProject('68f733be002c1d569ef4');   // Your Appwrite Project ID

export const account = new Account(client);
export default client;