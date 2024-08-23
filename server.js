const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "AsiyaMySQL21", // Replace with your MySQL password if any
  database: "school_management", // Make sure this matches the database you created
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to MySQL database.");
});

// Function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Add School API
app.post("/addSchool", (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  // Validate the input data
  if (
    !name ||
    !address ||
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) {
    return res.status(400).json({ error: "Invalid input data" });
  }

  // Insert the school data into the MySQL database
  const query =
    "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)";
  db.query(query, [name, address, latitude, longitude], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Failed to add school" });
    }
    // Respond with success message and the ID of the newly added school
    res
      .status(201)
      .json({
        message: "School added successfully",
        schoolId: result.insertId,
      });
  });
});

// List Schools API
app.get("/listSchools", (req, res) => {
  const userLat = parseFloat(req.query.latitude);
  const userLon = parseFloat(req.query.longitude);

  if (isNaN(userLat) || isNaN(userLon)) {
    return res.status(400).json({ error: "Invalid latitude or longitude" });
  }

  const query = "SELECT * FROM schools";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch schools" });
    }

    // Calculate distances and sort by distance
    results.forEach((school) => {
      school.distance = calculateDistance(
        userLat,
        userLon,
        school.latitude,
        school.longitude
      );
    });

    results.sort((a, b) => a.distance - b.distance);

    res.json(results);
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
