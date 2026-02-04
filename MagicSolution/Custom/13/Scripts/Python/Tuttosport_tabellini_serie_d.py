import os
from os import path
import json
import operator
def main(argv):
    import sys
    filepath = sys.argv[1]#"C:\\Users\\Equinox4\\source\\repos\\Tuttosport_tabellini_serie_d\\PythonApplication3\\newXml.xml"#
    output_path =sys.argv[2]#"C:\\Users\\Equinox4\\Desktop\\PythonFiles\\"# 
    fileExtension =sys.argv[4]# ".txt"#
    templateScript= sys.argv[5]#"Tuttosport_tabellini_serie_d.txt" #
    sys.path.insert(0, filepath)
    import xml.etree.ElementTree as et
    tree= et.parse(filepath)
    root= tree.getroot()
    from jinja2 import Environment, FileSystemLoader
    sys.path.insert(0, os.path.dirname(filepath))
    import Sport
    from Sport import Match,Team, Player, Goal, Logics ,FullChampResultsAndClassification
    reload(sys)  
    sys.setdefaultencoding('utf8')
    file_loader = FileSystemLoader (os.path.dirname(templateScript))
    env=Environment (loader= file_loader)
    template=env.get_template(os.path.basename(templateScript))
    tab='\t'
    name={}
    logics=Logics()
    fileGeneratedCount=0
    fullChampResultAndClassification = FullChampResultsAndClassification.createFullChampResultsAndClassificationFromXmlNode(root)
    
    output=template.render(fullChampResultAndClassification=fullChampResultAndClassification, tab=tab, newLine='\n', Logics=logics)
    fileGeneratedDestination =output_path
    fileGeneratedCount=fileGeneratedCount+1
    filename =str( fullChampResultAndClassification.fullChampResults.championshipCode) +str(fileGeneratedCount)+'.txt'
    name[fileGeneratedCount]= filename
    Logics.createFile(fileGeneratedDestination+filename, output.encode('utf-8'))

    s=json.dumps(name)
    print (s)    
if __name__ == "__main__":
    import sys
    main(sys.argv)

