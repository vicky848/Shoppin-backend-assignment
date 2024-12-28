# Crawler Application

This project is a web crawler application that interacts with a database, scrapes web data, processes it using various tools, and ensures scalability through multi-threading. Below is a breakdown of the features, technologies, and how to use the application.

## Features

1. **Database Integration**:
   - Uses SQLite to store domain and product URL data.
   - Supports CRUD operations for domains and product URLs.

2. **Web Scraping**:
   - Utilizes Puppeteer to scrape dynamic web content.
   - Parses HTML using Cheerio to extract product details.

3. **API Endpoints**:
   - POST `/domains`: Adds a list of valid domains to the database.
   - GET `/product_urls`: Retrieves the first 10 product URLs from the database.
   - GET `/product_urls/:id`: Fetches a specific product URL by ID.
   - POST `/product_urls`: Adds a product URL, scrapes data, and processes it.

4. **Data Processing**:
   - Sends scraped product details to a local API using Axios.
   - Stores product details in Redis for caching.
   - Adds product details to a Bull queue for asynchronous processing.

5. **Logging**:
   - Logs actions and errors using Winston.

6. **Scalability**:
   - Implements multi-threading with Node.js Cluster module.
   - Automatically respawns worker threads if they exit.

---

## Technologies Used

- **Express.js**: For creating the RESTful API.
- **SQLite**: As the database to store domains and product URLs.
- **Puppeteer**: For web scraping dynamic content.
- **Cheerio**: For parsing and extracting HTML content.
- **Axios**: For making HTTP requests.
- **Redis**: For caching scraped data.
- **Bull**: For queue management.
- **Winston**: For logging errors and information.
- **Node.js Cluster**: For multi-threaded scalability.

---

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Initialize the Database**:
   - Ensure SQLite is installed.
   - Create a `crawler.db` file in the project directory.
   - Add necessary tables (`domains` and `product_urls`).

4. **Run the Application**:
   ```bash
   node app.js
   ```

5. **Access the API**:
   - Server runs on `http://localhost:3000`

6. **Example Requests**:
   - Add domains:
     ```bash
     curl -X POST -H "Content-Type: application/json" -d '{"domains": ["https://example.com"]}' http://localhost:3000/domains
     ```
   - Add product URL:
     ```bash
     curl -X POST -H "Content-Type: application/json" -d '{"url": "https://example.com/product"}' http://localhost:3000/product_urls
     ```

---

## Logging

- **Error Logs**: Stored in `error.log`.
- **Combined Logs**: Stored in `combined.log`.

---

## Scalability

- Master process spawns worker threads for handling concurrent requests.
- If a worker exits, a new one is automatically created.

---

## Notes

- Ensure Redis is running locally on port `6379`.
- The database schema should match the queries in the application.
- Modify `puppeteer.launch` options if running in a restricted environment (e.g., CI/CD).

---

## License
This project is licensed under the MIT License. Feel free to use and modify as needed.

---

## Future Improvements

1. Add authentication for secure API access.
2. Improve domain validation logic.
3. Integrate cloud services for hosting and database management.
