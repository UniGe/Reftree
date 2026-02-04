# -- coding: utf-8 --
import os
import json
 #coding: utf8
def main(argv):
    # -*- coding: utf-8 -*-
    import sys
    filepath = sys.argv[1]
    output_path = sys.argv[2]
    fileExtension = sys.argv[4]
    templateScript= sys.argv[5]
    import xml.etree.ElementTree as et
    sys.path.insert(0, filepath)
    import xml.etree.ElementTree as et
    tree= et.parse(filepath)
    root= tree.getroot()
    from jinja2 import Environment, FileSystemLoader
    sys.path.insert(0, os.path.dirname(filepath))
    import Sport
    from Sport import FullChampResultsAndClassification,Logics
    file_loader = FileSystemLoader (os.path.dirname(templateScript))
    env=Environment (loader= file_loader)
    template=env.get_template(os.path.basename(templateScript))
    
    logics=Logics()
    name={}
    fileGeneratedCount=0
    fullChampResultAndClassification = FullChampResultsAndClassification.createFullChampResultsAndClassificationFromXmlNode(root) 
    results = fullChampResultAndClassification.fullChampResults.getLastWeekPlayed()
    e=u"è"
    replace=e.replace("{{e}}",u'è')
    tab='\t'
    newline='\n'
    output= template.render(fullChampResultAndClassification=fullChampResultAndClassification,logics=logics,tab=tab,newline=newline, e=replace)
    fileGeneratedDestination =output_path
    fileGeneratedCount=fileGeneratedCount+1
    filename = str(fullChampResultAndClassification.fullChampResults.championshipCode)+'.txt'
    name[fileGeneratedCount]= filename
    Logics.createFile(fileGeneratedDestination+filename, output)
    print (output.encode('utf-8'))

    s=json.dumps(name, indent=2)             
    print (s)


if __name__ == "__main__":
    import sys
    main(sys.argv)
	