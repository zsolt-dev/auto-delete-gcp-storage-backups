# Auto delete Google Cloud Platform (GCP) Storage Backups

This is a **zero configuration** backup deletion "Google Cloud Function" that automatically delete backups from "Google Cloud Platform Storage" buckets.

Please give this script a **Star** to let everyone know that you are doing backups *The Right Way™* 

## How does it work?
- This Google Cloud Function automatically runs each time a new object(file) is created in a GCP Storage bucket.
- It list all objects in a bucket and keep hourly backups for the desired number of hours and keeps one daily backup for the desired number of days.


## Why do I need it?
Most backups scripts do not follow the most important requirement for safe backups:
**Your backup sript MUST NOT have the access to delete/edit backups, only to create them.**
The reason for this is that when your server is compromised, the attackers cannot delete your backups.

## Default values
The script requires no configuration. Here are the default values:
```js
const numHoursToKeepRecentBackups = 72; // how many hours to keep recent backups
const numDaysToKeepOneDailyBackup = 30; // how many days to keep one daily backup 
```

The bucket name is automatically configured to the one, that this script is invoked on. 


## How to create the actual backups?
- It is up to you, what you backup and how you get it to the GCP Storage.
- This backup script works nice: https://github.com/zsolt-dev/backup-mysql-to-gcp-storage/
- Just make sure, when you upload the object, you use service account that is allowed to only create objects, not to edit or delete them.
- The backup names are not important at all, this script uses the object creation timestamp.
- Store your backup as a single file. If you backup from multiple scripts and therefore creating multiple archives, create a new bucket for each archive file.

## Installing via gcloud CMD line tool:

1. Clone this repository to your local machine:
```bash
git clone https://github.com/zsolt-dev/auto-delete-gcp-storage-backups.git
```

2. To deploy the function, replace YOUR_TRIGGER_BUCKET_NAME with your bucket name and run the following command.
```bash
gcloud functions deploy autoDeleteBackups --runtime nodejs14 --trigger-resource YOUR_TRIGGER_BUCKET_NAME --trigger-event google.storage.object.finalize
```
**==WARNING==**
**All files in the YOUR_TRIGGER_BUCKET_NAME older than specified in the settings will be deleted. Double check your bucket name!!**

## Installing via Google Cloud Console
1. Click on Cloud Functions menu in the Google Cloud Console
2. Click "Create function" button
3. Use the following settings:

- Function name => any name, for example: "AutoDeleteBackupsFromBucket_YOUR_BUCKET_NAME"
- Trigger => Cloud Storage
- Event Type => Finalize/Create
- Bucket => Select your bucket with the backups.
- WARNING: All files in the selected bucket older than specified in the settings will be deleted. Double check your bucket name!!**
- Memory allocated => 128MB
- Runtime => Node.js 14
- Entry point => autoDeleteBackups

4. Paste index.js from this repo to the code field
5. Click "Create" and you are done. Now try to upload some backup and check the Stackdriver logs.
