import { prisma } from "./../app";
import { NextFunction, Request,Response } from "express";
import bcrypt from 'bcrypt'
import * as utils from '../utils/index';

const SALT:string | number = process.env.SALT_ROUND || 10;

export const findById = async (req : Request,res:Response,next:NextFunction) => {
  const {id} = req.params;
  try{
    const user = await prisma.users.findUnique({
      where : {
        id
      },
      select:{
        scores:true,
        id:true,
        username:true,
        avatar:true
      },
    })
    try{
      if(!user?.username){
        throw new Error('Kullanıcı bulunamadı')
      }
    }catch(err:Error | any){
      return next({
        success:false,
        message:err.message
      });
    }
    return res.send(user);
  }catch(er){
    return next(er);
  }
}

export const createUser = async (req : Request | any,res:Response,next:NextFunction) => {
  const {username,password} = req.body;
  const avatar = req.files?.avatar;

  const url = utils.fullURL(req);
  const path  = 'upload/' + username + '-avatar' + '-' + avatar?.name;

  try{
    const hashedPassword = await bcrypt.hash(password,SALT)
  
    //check user exist
    let existUser = await prisma.users.findFirst({
      where : {
        username,
        password : hashedPassword,
      }
    })
    
    try{
      if(existUser){
        throw new Error('Kullanıcı mevcut')
      }
    }catch(err:Error | any){
      return next({
        success:false,
        message:err.message
      });
    }
    
    avatar.mv(path,(error:Error) => {
      try{
        if(error){
          throw new Error('Dosya yüklenemedi..')
        };
      }catch(err:Error | any){
        return next({
          message:err.message,
          success:false
        })
      }
    });
    
    const user = await prisma.users.create({
      data: {
        username,
        password : hashedPassword,
        avatar:`${url}/${username + '-avatar' + '-' + avatar?.name}`,
      },
    })

    try{
      if(!user){
        throw new Error('kullanıcı olusturulamadı..');
      }
    }catch(err:Error | any){
      return next({
        message:err.message,
        success:false
      })
    }
  
    return res.send({
      ...user,
      password:null
    })
  }catch(er){
    return next(er)
  }
}

export const logIn = async (req : Request,res:Response,next:NextFunction) => {
  const {username,password}  = req.body;

  try{
    //find the user according to username
    const user = await prisma.users.findUnique({
      where : {
        username
      },
      include: {
        scores: true,
      }
    })
    

    if(!user){
      try {
        throw new Error('Kullanıcı bulunamadı')
      } catch (err:any) {
        return next({
          success:false,
          message:err.message
        })
      }
    }

    const isMatched = await bcrypt.compare(password, user?.password);
    if(!isMatched){
      try {
        throw new Error('Hatalı şifre')
      } catch (err:any) {
        return next({
          success:false,
          message:err.message
        })
      }
    }

    return res.send({
      ...user,
      password:null
    });

  }catch(er){
    return next(er)
  }

}

export const addScore = async (req : Request,res:Response,next:NextFunction) => {
  const {score,id,result} = req.body;
  try{
    const userScore = await prisma.scores.create({
      data:{
        user : {
          connect : {
            id:id
          }
        },
        score:Number(score),
        date:new Date(Date.now()).toLocaleDateString('tr-TR'),
        result:result
      }
    })
    try{
      if(!userScore){
        throw new Error('Skor eklenemedi')
      }
    }catch(err:Error | any){
      return next({
        message:err.messsage,
        success:false
      })
    }
    return res.send(userScore)

  }catch(er){
    return next(er)
  }
}