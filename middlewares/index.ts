import {Request,Response,NextFunction} from 'express';
import {validationResult} from 'express-validator'

//validator 
export const validate = (validations:any) => {
  return async (req:Request, res:Response, next:NextFunction) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
};

//Error handler
export function errorHandler (err : any | Error ,req : Request,res : Response,next:NextFunction) {
  if (res.headersSent) {
    return next(err)
  }
  res.status(500).send({ error: err })
}

// export const errorHandler = (err : any | Error ,req : Request,res : Response) => {
//   return res.status(400).json(err);
// }
