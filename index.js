
/**
 * Runs each time after a new object (backup) is added to the bucket and deletes old backups.
 * Changes: https://github.com/zsolt-dev/auto-delete-gcp-storage-backups/
 */

const numHoursToKeepRecentBackups = 72; // how many hours to keep recent backups
const numDaysToKeepOneDailyBackup = 30; // how many days to keep one daily backup 

// bucket name is the same as this script is invoked on


const Storage = require('@google-cloud/storage');
// Creates a client
const storage = new Storage();

const getFileObjectWithMetaData = async (bucketName, fileName) => {
  const [metaData] = await storage.bucket(bucketName).file(fileName).getMetadata();
  return ({ fileName, created: metaData.timeCreated });
};

const deleteFileFromBucket = async (bucketName, fileName) => {
  return await storage.bucket(bucketName).file(fileName).delete();
};

exports.autoDeleteBackups = async (event) => {
  const { bucket } = event;

  // get the file names as an array
  let [allFiles] = await storage.bucket(bucket).getFiles();
  allFiles = allFiles.map(file => file.name);
  console.log(`all files: ${allFiles.join(', ')}`);

  // transform to array of objects with creation timestamp { fileName: xyz, created: }
  allFiles = allFiles.map(fileName => getFileObjectWithMetaData(bucket, fileName));
  allFiles = await Promise.all(allFiles);


  const filesToKeep = new Set(); // using set insted of array since set does not allow duplicates

  // recent backups
  allFiles.forEach(backup => {
    const createdDate = new Date(backup.created);
    createdDate.setHours( createdDate.getHours() + numHoursToKeepRecentBackups );
    if(createdDate > new Date()) filesToKeep.add(backup.fileName);
  })
  
  // daily backups
  for(i =0; i < numDaysToKeepOneDailyBackup; i++) {
    // get day
    const now = new Date();
    now.setDate( now.getDate() - i );
    dateString = now.toISOString().substr(0, 10);
    // keep only one from that day
    const backupsFromThatDay = allFiles.filter(backup => backup.created.startsWith(dateString));
    if(backupsFromThatDay && backupsFromThatDay.length > 0) filesToKeep.add(backupsFromThatDay[0].fileName);
  }
  
  // filesToKeep.forEach(item => console.log(item));
  
  const filesToDelete = allFiles.filter(backup => !filesToKeep.has(backup.fileName));
  console.log(`Deleting ${filesToDelete.length} files: ${filesToDelete.map(backup => backup.fileName).join(', ')}`);

  const deletePromises = filesToDelete.map(backup => deleteFileFromBucket(bucket, backup.fileName));
  await Promise.all(deletePromises);

};
