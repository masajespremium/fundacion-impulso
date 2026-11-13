const serverless=require('serverless-http');
const app=require('../../api-app');
exports.handler=async(event,context)=>{event.path=event.path.replace(/^\/\.netlify\/functions\/api/,'/api');return serverless(app)(event,context)};
