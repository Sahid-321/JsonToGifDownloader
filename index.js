// File: server.js

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

app.post('/download-gif', async (req, res) => {
    const exercises = req.body;

    // Array to store the modified exercises
    const modifiedExercises = [];

    for (const exercise of exercises) {
        const { bodyPart, name, gifUrl } = exercise;

        // Create directory if it doesn't exist
        const dirPath = path.join(__dirname, bodyPart.toLowerCase());
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Convert name to snake_case
        const fileName = name.toLowerCase().replace(/ /g, '_') + '.gif';
        const filePath = path.join(dirPath, fileName);

        try {
            // Download the GIF
            const response = await axios({
                url: gifUrl,
                method: 'GET',
                responseType: 'stream'
            });

            // Save the GIF to the file system
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            // Ensure the write stream is finished
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Update the gifUrl in the current exercise object
            exercise.gifUrl = `/${bodyPart.toLowerCase()}/${fileName}`;
            modifiedExercises.push(exercise);

            console.log(`Downloaded and saved ${fileName} to ${dirPath}`);
        } catch (error) {
            console.error(`Failed to download ${fileName} from ${gifUrl}`, error);
            res.status(500).json({ error: `Failed to download ${fileName}` });
            return;
        }
    }

    // Respond with the modified exercises array
    res.status(200).json(modifiedExercises);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
