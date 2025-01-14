// api/get-file.js

export default function handler(req, res) {
  // Quando você fizer uma requisição (GET ou POST) em /api/get-file,
  // a Vercel vai rodar essa função.
  res.status(200).json({ 
    message: 'Hello World! Sua função get-file está funcionando.' 
  });
}
