import express from 'express';
import { Marked, marked } from 'marked';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config'; // Load environment variables from .env file



const app = express();
const PORT = 3000;  // Changed to port 3000

// const [allergies, setAllergies] = useState([]);
// const [chronicDiseases, setChronicDiseases] = useState([]);

// useEffect(() => {
//   const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user) {
//           setUid(user.uid);
//           checkUserDoc(user.uid);
//           fetchDocument(user.uid);
//       } else {
//           setUid(null);
//       }
//   });
//   return () => unsubscribe();
// }, []);

// const fetchDocument = async (userId) => {
//   try {
//       const userDocRef = doc(db, "Demographics", userId);
//       const userDoc = await getDoc(userDocRef);

//       if (userDoc.exists()) {
//           const data = userDoc.data();
//           setAllergies(data.Allergies || []);
//           setChronicDiseases(data.ChronicDiseases || []);
//           setDocExists(true);
//       }
//   } catch (error) {
//       console.log(error);
//       toast.error("An error occurred while fetching your details.");
//   }
// };


// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/', (req, res) => {
  res.send('Server is healthy');
});

// Test endpoint to verify server is running
app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Server is running!' });
});

// Recipe generation endpoint
app.get("/recipestream", async (req, res) => {
  try {
    const { ingredients, mealType, cuisine, cookingTime, complexity } = req.query;
    console.log('Received request with params:', req.query);

    const prompt = [
      "Generate a recipe that incorporates the following details:",
      `[Ingredients: ${ingredients}]`,
      `[Meal Type: ${mealType}]`,
      `[Cuisine Preference: ${cuisine}]`,
      `[Cooking Time: ${cookingTime}]`,
      `[Complexity: ${complexity}]`,
      "Please provide a detailed recipe, including steps for preparation and cooking. Only use the ingredients provided.",
      "The recipe should highlight the fresh and vibrant flavors of the ingredients.",
      "Also give the recipe a suitable name in its local language based on cuisine preference."
    ];

    console.log('Using API key:', process.env.GOOGLE_API_KEY ? 'API key is set' : 'API key is missing');
    
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    console.log('Created GenAI instance');
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    console.log('Got model instance');
    
    console.log('Sending prompt to Gemini:', prompt);
    const result = await model.generateContent(prompt);
    console.log('Received response from Gemini');
    
    const response = result.response;
    console.log('Processing response');
    
    if (response && response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      const generatedText = marked(response.candidates[0].content.parts.map(part => part.text).join("\n"));
      console.log('Successfully generated recipe');
      res.send(generatedText);
    } else {
      console.error('Invalid response structure:', response);
      res.status(500).json({ error: 'Failed to generate recipe' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the server: http://localhost:${PORT}/test`);
  console.log(`Recipe endpoint: http://localhost:${PORT}/recipestream`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});