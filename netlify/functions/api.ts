import serverless from "serverless-http";
import app from "../../server/app";

const handlerFn = serverless(app);

export const handler = async (event: any, context: any) => {
  // Rewrite the Netlify function path back to what Express expects
  event.path = event.path.replace(/^\/\.netlify\/functions\/api/, "/api") || "/api";
  return handlerFn(event, context);
};