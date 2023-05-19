import { errorHandler, validate } from "./middlewares/index";
import * as controller from './controllers/index';
import express,{Request,Response,NextFunction} from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client'
import {body} from 'express-validator'
import bodyParser from 'body-parser';
import cors from 'cors';
import fileUpload from 'express-fileupload';

//prisma connection to mongodb
export const prisma = new PrismaClient()

dotenv.config();
const PORT = process.env.PORT || 3030;

const app = express();
app.use(cors())
app.use(express.static('upload'));
app.use(express.static('view'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
// max file size 5 mb
app.use(fileUpload({
  limits:{
    fileSize : 5 * 1024 * 1024
  }
}));

app.get('/delete',async (req:Request,res:Response) => {
  
  await prisma.scores.deleteMany();
  await prisma.users.deleteMany();
  
  res.send('veriler silindi..')
})

app.get('/user/:id', controller.findById)

app.post('/create',validate([
  body('username').isLength({max:20,min:2}).withMessage('kullanıcı adı en az 2 en fazla 20 harf olabilir'),
  body('username').custom(async (value,{req} )=> {
    const user = await prisma.users.findFirst({
      where : {
        username : value
      }
    })
    if (user && user.username === req.body.username) {
      throw new Error('Bu kullanıcı adı kullanılmakta.');
    }
  }),
  body('password').isAlphanumeric('tr-TR').withMessage('sadece türkçe karakter içerebilir').isLength({max:20,min:2}).withMessage('şifre adı en az 2 en fazla 20 harf olabilir'),
  body('password').custom(async (value,{req}) => {
    const isMatched = req.body.password === value;
    if (!isMatched) {
      throw new Error('şifreler eşleşmedi');
    }
  }),
  body('avatar')
  .custom( (value,{req}) => {
    // Dosya MIME türünü kontrol et
    if(!req.files && !req.files.avatar && Object.keys(req.files).length === 0){
      throw new Error('Avatar yüklenemedi');
    }
    if (!req.files.avatar.mimetype || !['image/jpeg', 'image/png','image/jpg'].includes(req.files.avatar.mimetype)) {
      throw new Error('Avatarınızı lütfen JPEG,PNG veya JPG formatında giriniz');
    }
    return true;
  })
]),controller.createUser)

app.post('/login',validate([
  body('username').isLength({max:20,min:2}).withMessage('kullanıcı adı en az 2 en fazla 20 harf olabilir'),
  body('password').isAlphanumeric('tr-TR').withMessage('sadece türkçe karakter içerebilir').isLength({max:20,min:2}).withMessage('şifre adı en az 2 en fazla 20 harf olabilir')
]),controller.logIn);


app.post('/score',validate([
  body('userId').custom(async (value) => {
    const user = await prisma.users.findFirst({
      where : {
        id : value
      }
    })

    if(!user?.username){
      throw new Error('Kullanıcı bulunamadı')
    }

  }),
  body('date').custom(async (value,{req}) => {
    const todayUserRecord = await prisma.scores.findFirst({
      where : {
        userId : req.body.id,
        date: new Date(Date.now()).toLocaleDateString('tr-TR')
      }
    })
    if(todayUserRecord?.score){
      throw new Error('Kullanıcının bugün kaydı bulunmakta')
    }
  }),
  body('score').isNumeric().isLength({min:0,max:100}).withMessage('Skor 0-100 arasında verilebilir.'),
]),controller.addScore)


app.use(errorHandler);

const main = async () => {
  try{
    await prisma.$connect();
    app.listen(PORT,() => {
      console.log(`server ${PORT} portunda çalışmakta...`);
    })
  }catch(er){
    await prisma.$disconnect();
  }
}

main();

