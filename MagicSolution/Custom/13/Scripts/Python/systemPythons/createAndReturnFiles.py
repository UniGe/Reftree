import os, shutil, sys, json, datetime
from os.path import basename
from os import path
import io
def main (argv):   
    zipFileFullLocation = sys.argv[1]
    newDirectoryLocation = sys.argv[2]
    sourceDirectory = sys.argv[3]
    fileType = 'zip'
    nowTime = sys.argv[4];
    additionalFiles= sys.argv[5]
    t0= datetime.datetime.today().strftime("%Y%m%d%H%M%S%f%z")
    zipName='{0}_{1}'.format(t0, os.path.basename(zipFileFullLocation))
    shutil.make_archive(os.path.join(os.path.dirname(zipFileFullLocation), zipName),fileType,sourceDirectory)

    #names=['FileName']
    fileList=list()
    if additionalFiles=='1':
        files = os.listdir(sourceDirectory)
        
        
        for fileName in files:
            fileNames={}
            newFileName = '{0}_{1}'.format(t0,fileName.lstrip())
            shutil.move(os.path.join(sourceDirectory,fileName), os.path.join(newDirectoryLocation,newFileName))
            fileNames['name']=newFileName
            fileNames['ext']='.txt' #a static value for test. 
            fileNames['size']=111
            fileList.append(fileNames)
    fileNames={}
    fileNames['name']= '{0}{1}'.format(zipName,'.zip')
    fileNames['ext']='.zip'
    fileNames['size']=111
    fileList.append(fileNames)
    s=json.dumps(fileList, indent=0)
    s=s.replace("\r", "")
    s=s.replace("\n", "")
    outputFileName = nowTime+".json"
    with io.open(os.path.join(os.path.dirname(zipFileFullLocation), nowTime +".json"), "w") as text_file:
        #text_file.write(unicode(json.dumps(s, ensure_ascii=False))) 
        text_file.write(unicode(s))		
    
    

if __name__ == "__main__":
    main(sys.argv)