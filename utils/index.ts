import { Request } from "express";

export const fullURL = (req:Request) => {
  const PORT = process.env.PORT || 3030;
  const url = req.protocol + '://' + req.hostname + ':' + PORT;
  return url;
}