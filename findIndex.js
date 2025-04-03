const ExcelJS = require("exceljs");
const mongoose = require("mongoose");
require('dotenv').config();

// MongoDB connection details
const uri = process.env.STAGE_DB;

const outputFileName = "not_used_indexes.xlsx";
const dbName = "Live_Practice_Business_Copy";

async function generateExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Vagaro DBA";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet("Unused Indexes");

  // Define Headers
  worksheet.columns = [
    { header: "Collection Name", key: "collectionName", width: 25 },
    { header: "Unused Index", key: "unusedIndex", width: 100 },
  ];

  try {
    // Mongoose connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 5000,
      minPoolSize: 100,
      maxIdleTimeMS: 60000,
    };

    // Connect to MongoDB
    await mongoose.connect(uri, options);
    console.log("Connected to MongoDB via Mongoose");

    const db = mongoose.connection.useDb(dbName);

    // Get collection info
    let collections = await db.db.listCollections().toArray();
    collections = collections.sort((a, b) => a.name.localeCompare(b.name)); // Sort by name

    for (const coll of collections) {
      if (coll.name === "system.profile") {
        console.log("Skipping system.profile collection...");
        continue;
      }
      console.log("Checking collection >>", coll.name);

      const stats = await db.db.collection(coll.name).aggregate([
        {
          $indexStats: {},
        },
        {
          $match: {
            "spec.expireAfterSeconds": { $exists: false },
            "accesses.ops": { $lte: 10 },
            name: { $ne: "_id_" },
          },
        },
        {
          $project: {
            name: 1,
            ops: "$accesses.ops",
            since: "$accesses.since",
          },
        },
      ]).toArray();

      if (stats.length > 0) {
        console.log("Found indexes >>", stats);
        let formattedIndexes = stats.map((index, idx) => `/* ${idx + 1} */\n${JSON.stringify(index, null, 4)}`).join("\n\n");
        worksheet.addRow({ collectionName: coll.name, unusedIndex: formattedIndexes });
      }else{
        console.log("Not found any indexes which are not being used less than threshold times.");
      }
    }

    // Save to Excel file
    await workbook.xlsx.writeFile(outputFileName);
    console.log(`Excel file saved as ${outputFileName}`);
  } catch (error) {
    console.error("Error: ", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
generateExcel();
