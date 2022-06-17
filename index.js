import dotenv from 'dotenv'
import express from 'express';
import cors from 'cors'
import mongoose from "mongoose";
import bodyParser from "body-parser";
import {cyrb53} from "./hashFunc.js";
import dns from "node:dns"
dotenv.config();

const app = express();


// Mongodb
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect(process.env.MONGO_URI);
}
const shortURLSchema = new mongoose.Schema({
  url: { type: String,
    unique: true},
  short_url: { type: String,
    unique: true}
});
const ShortURL = mongoose.model('ShortURL', shortURLSchema);


// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) =>{
  if(req.body.url.substring(0, 3) !== 'htt'){
    req.body.url = 'https://' + req.body.url;
  }
  const url = new URL(req.body.url);
  const hostname = url.hostname;
  dns.lookup(hostname, (err)=>{
    if(err){
      res.json({ error: 'invalid url' });
    }else{
      ShortURL.findOne({url: req.body.url}, (err, data) =>{
        if(err){
          console.log(err);
        }
        if(data){
          res.json({ original_url : data.url, short_url : data.short_url})
        }else{
          const doc  = {url: req.body.url, short_url: cyrb53(req.body.url).toString(36)};
          ShortURL.create(doc, (err) =>{
              if(err) console.log(err);
              res.json({ original_url : doc.url, short_url : doc.short_url})
            }
          )
        }

      })
    }
  })
})


app.get('/api/shorturl/:hash', (req, res) =>{
  ShortURL.findOne({short_url: req.params.hash}, (err, data) => {
    if(err) console.log(err);
    res.redirect(data.url);
  })
})



app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
