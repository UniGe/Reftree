 # -- coding: utf-8 --
import os
from os import path
import json
import re
import sys
import operator
#sys.path.insert(0, '\\\\192.168.100.100\systemPythons')
import Sport
from Sport import FullChampResultsAndClassification,Logics
 #coding: utf8
def main(argv):
    import sys
    filepath = sys.argv[1]
    output_path = sys.argv[2]
    fileExtension = sys.argv[4]
    templateScript= sys.argv[5]
    sys.path.insert(0, filepath)
    import xml.etree.ElementTree as et
    tree= et.parse(filepath)
    root= tree.getroot()
    from jinja2 import Environment, FileSystemLoader
    sys.path.insert(0, os.path.dirname(filepath))
    import Sport
    from Sport import FullChampResultsAndClassification,Logics
    reload(sys)  
    sys.setdefaultencoding('utf8')
    file_loader = FileSystemLoader (os.path.dirname(templateScript))
    env=Environment (loader= file_loader)
    template=env.get_template(os.path.basename(templateScript))
    logics= LogicsExtended() 
    name={}
    fileGeneratedCount=0
    fullChampResultAndClassification = FullChampResultsAndClassification.createFullChampResultsAndClassificationFromXmlNode(root) 
    e='è'
    tab='\t'
    newline='\n'
    output= template.render(fullChampResultAndClassification=fullChampResultAndClassification,logics=logics,tab=tab,newline=newline,e=e)
    fileGeneratedDestination =output_path#"C:\Users\Equinox3\Desktop\PythonFiles\\"
    fileGeneratedCount=fileGeneratedCount+1
    filename = str(fullChampResultAndClassification.fullChampResults.championshipCode)+'.txt'
    name[fileGeneratedCount]= filename
    Logics.createFile(fileGeneratedDestination+filename, output.encode('utf-8'))

    s=json.dumps(name)              
    print (s)

if __name__ == "__main__":
    import sys
    main(sys.argv)
