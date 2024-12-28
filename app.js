const express = require("express");
const sqlite3 = require("sqlite3");
const {open} = require("sqlite");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const axios = require("axios");
const Redis = require("ioredis");
const Bull = require("bull");
const winston = require("winston");
const path = require("path");
const dbPath = path.join(__dirname, "crawler.db");



const app = express();

let db = null;

const initializeDBAndServer = async() => {
  try{
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
        
    });
    console.log("Database connected successfully")
   
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
  app.listen(3000, () => {
    console.log('Server is running on port 3000');
})
    
};


initializeDBAndServer();

app.use(express.json());




// app post domains 
 
  
 app.post('/domains', async (request, response) => {
  try{
    const { domains } = request.body;
    // validate domain list

    const validDomains = domains.filter(domain => {
      //  validate domain format
      const regex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w.-]*)*\/?$/;
      return regex.test(domain);
    });
    // store valid domains in database
    const addDomainsQuery = `
    INSERT INTO domains (domain)
    VALUES (?);
    `;
    await db.run(addDomainsQuery, [...validDomains]);
    response.send('Domains added successfully');
    
  } catch(error){
    console.log('Error:', error)
    response.status(500).send('Server Error')
  }
 });
 

app.get('/product_urls' , async (request , response)=>{

   try{
    const getProductUrlQuery = `
    SELECT *
    FROM product_urls
    LIMIT 10;
   `
   const urlArray = await db.all(getProductUrlQuery)

 response.send(urlArray)
   }  catch(error){
    console.log('Error:', error)
    response.status(500).send('Server Error')
   }

});

// get id  


app.get('/product_urls/:id', async (request, response) => {
  try{
    const { id } = request.params;

    const getProductUrlQuery = `
    SELECT *
    FROM product_urls
    WHERE id =?;
   `
   const urlArray = await db.get(getProductUrlQuery, [id])

 response.send(urlArray)
   }  catch(error){
    console.log('Error:', error)
    response.status(500).send('Server Error')
   }

});


// post 


app.post('/product_urls', async (request, response) => {
  try{
    const urlDetails = request.body 

  const { url } = urlDetails;

  const addUrlQuery = `

  INSERT INTO product_urls (url) 
  VALUES (?);


  `
  const dbResponse = await db.run(addUrlQuery, [url]);

// use pupteteer to scrape the url 
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 },
  });
  const page = await browser.newPage();

  await page.goto(url);

  const html = await page.content();

  await browser.close()

//   USE cheerio to prase the HTML

  const $ = cheerio.load(html);

  const productDetails = [];

  $('div.product-item').each((index, element) => {
    const title = $(element).find('h2').text();
    const price = $(element).find('.price').text();
    const image = $(element).find('img').attr('src');

    productDetails.push({ title, price, image });
  });

    // Use Axios to send a request to the url 
    const response = await axios.post('http://localhost:3000/products', { productDetails });
    console.log('Product details sent to API:', response.data);
    // Add the product details to Redis
    const redisClient = new Redis();
    await redisClient.hmset(`product:${dbResponse.lastID}`, productDetails);
    redisClient.quit();

    // Add the product details to Bull Queue
    const queue = new Bull('product_queue', { redis: { port: 6379, host: 'localhost' } });
    await queue.add({ id: dbResponse.lastID, productDetails });
    console.log('Product details added to Bull Queue');



    // Use Winston to log the url 

 const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });
  logger.info(`New URL added: ${url}`);



   response.send({ message: 'URL added successfully', id: dbResponse.lastID });
  }
  catch(error){
    console.log('Error:', error)
    response.status(500).send('Server Error')
  }

});

module.exports = app 