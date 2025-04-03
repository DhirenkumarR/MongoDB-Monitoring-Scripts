//Requirement 
// Node js
//install below packages
// npm i mongoose
// npm i exceljs
// npm i dotenv

const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection details (modify as needed)
const mongoUrl = process.env.DEV_DB; // Replace with your MongoDB URI
// const mongoUrl = process.env.STAGE_DB; // Replace with your MongoDB URI
const outputFileName = 'database_info.xlsx';
const sizeThresholdMB = 500;

async function generateExcelFromDatabase() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Vagaro DBA';
  workbook.created = new Date();

  let dataFound = false; // Flag to track if any data is found

  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB via Mongoose');

    // Get list of databases
    const adminDb = mongoose.connection.db.admin();
    const { databases } = await adminDb.listDatabases();

    // Iterate over each database
    for (const dbInfo of databases) {
      const dbName = dbInfo.name;

      // Switch to the current database
      const db = mongoose.connection.useDb(dbName);

      // Get collection info
      let collections = await db.db.listCollections().toArray();
      collections = collections.sort((a, b) => a.name.localeCompare(b.name)); // Sort by name
      const collectionData = [];

      for (const coll of collections) {
        // Use the underlying MongoDB driver to get stats
        const stats = await db.db.command({ collStats: coll.name });
        
        const sizeInMB = +(stats.storageSize / 1_000_000).toFixed(2); // Convert bytes to MB

        // Below code is only for Fun and console log Please ignore it...--------------
        const sizeFormatted = formatSize(stats.storageSize);
        console.log(`\x1b[32m${dbName}.${coll.name}\x1b[0m \x1b[34m=>\x1b[0m ${sizeFormatted}`);
        //------------------------------------------------------------------------------

        // Only include collections which is higher than threshold
        if (sizeInMB > sizeThresholdMB) {
          collectionData.push({
            name: coll.name,
            size: sizeInMB,
          });
        }
      }

      // Only create a worksheet if there’s data (collections > 1 GB)
      if (collectionData.length > 0) {
        dataFound = true; // Set flag to true if data is found
        const worksheet = workbook.addWorksheet(dbName, {
          properties: { tabColor: { argb: 'FF00FF00' } }, // Green tab color
        });

        // Define columns
        worksheet.columns = [
          { header: 'Collection Name', key: 'name', width: 30 },
          { header: 'Size (MB)', key: 'size', width: 15 },
        ];

        // Add rows
        worksheet.addRows(collectionData);

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' }, // Light gray background
        };
      }
    }

    // Write to file only if data is found
    if (dataFound) {
      await workbook.xlsx.writeFile(outputFileName);
      console.log(`Excel file saved as ${outputFileName}`);
    } else {
      console.log('No data found that meets the size threshold. Excel file not created.');
    }
  } catch (error) {
    console.error('Error generating Excel file:', error);
  } finally {
    // Close Mongoose connection
    await mongoose.connection.close();
  }
}

// ignore below function it is only using in fun console log
function formatSize(bytes) {
  const GB = 1_000_000_000;
  const MB = 1_000_000;
  const KB = 1_000;

  if (bytes >= GB) {
      return `\x1b[35m${(bytes / GB).toFixed(2)} GB\x1b[0m`; // Purple for GB
  } else if (bytes >= MB) {
      return `\x1b[33m${(bytes / MB).toFixed(2)} MB\x1b[0m`; // Yellow for MB
  }
  return `\x1b[36m${(bytes / KB).toFixed(2)} KB\x1b[0m`; // Cyan for KB
}
//---------------------------------------------------------------

// Run the script
generateExcelFromDatabase();