/*
 * Title: Library for storing a retreiving server data
 * Description:  for this project, we're not using an actual db, so this library works with the disk storage on the server
 * Note: CRUD (create, read, update, delete)
 *
 */

const fs = require('fs');
const path = require('path');

var lib = {};

// most of the files/dirs will live in .data, so we need get path
lib.baseDir = path.join(__dirname, '/../.data/');

// We will be making sub-directories and treating those as "tables" of records
lib.create = function(dir, file, data, callback){
    // this fn uses the "error-back" pattern, where you do a thing,
    // check for a error, and if there is an error, you send a callback
    // with the error message, otherwise continue
    const path = lib.baseDir+dir+'/'+file+'.json'; 
    // error if file already exists
    const mode = 'wx'; 
    // open file
    fs.open(path, mode, function(error, fileDescriptor){
        if (!error && fileDescriptor){
            // convert data to string
            var stringData = JSON.stringify(data);
            // write file
            fs.writeFile(fileDescriptor, stringData, function(error){
                if (!error){
                    // close file
                    fs.close(fileDescriptor, function(error){
                        if (!error){
                            // close success
                            callback(false);
                        } else {
                            callback('Error closing file');
                        }
                    });
                } else {
                    callback('Error writing to new file');
                }
            }); 
        } else {
            callback('Error creating file. It may already exist');
        }
    });
};


lib.read = function(dir, file, callback){
    const path = lib.baseDir+dir+'/'+file+'.json';
    fs.readFile(path, 'utf-8', function(error, data){
        callback(error, data);
    });  
};



lib.update = function(dir, file, data, callback){
    const path = lib.baseDir+dir+'/'+file+'.json';
    // error out if file does not exist
    const mode = 'r+';
    fs.open(path, mode, function(error, fileDescriptor){
        if(!error && fileDescriptor){
            var stringData = JSON.stringify(data); 
            
            // truncate file contents before write
            fs.ftruncate(fileDescriptor, function(error){
                if (!error){
                    // write
                    fs.writeFile(fileDescriptor, stringData, function(error){
                        if (!error){
                            // close
                            fs.close(fileDescriptor, function(error){
                                if(!error){
                                    // close success
                                    callback(false);
                                } else {
                                    callback('Error closing file');
                                }
                            });
                        } else {
                            callback('Error writing to file');
                        }
                    });
                } else {
                    callback('Error truncating file');
                }    
            });
        } else {
            callback('Error opening file for update.  It may not exist.');
        }
    });
};


lib.delete = function(dir, file, callback){
    const path = lib.baseDir+dir+'/'+file+'.json';
    // unlinking file
    fs.unlink(path, function(error){
        if (!error){
            callback(false);
        } else {
            callback('Error deleting file');
        }
    });
};

module.exports = lib;



















