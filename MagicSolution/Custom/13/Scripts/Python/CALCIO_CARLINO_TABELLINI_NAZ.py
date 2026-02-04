import os
from os import path
import json
import operator
def main(argv):
    import sys
    filepath = "C:\\Users\\Equinox4\\source\\repos\\PythonApplication3\\PythonApplication3\\newXml.xml"#sys.argv[1]
    output_path = "C:\\Users\\Equinox4\\Desktop\\PythonFiles\\"#sys.argv[2]
    fileExtension = ".tnz"#sys.argv[4]
    templateScript= "CALCIO_CARLINO_TABELLINI_NAZ.txt" #sys.argv[5]
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
    events =FullChampResultsAndClassification.createFullChampResultsAndClassificationFromXmlNode(root)
    matches = list ()
    
    if events is not None:
        for event in events.fullChampResults.champResultList:
            for match in event.matches.resultList:# kjo do bohet e gjitha mrena tek match thujse e gjitha
                matches.append(match)#duhet te rujm dhe ID
    matches.sort(key=operator.attrgetter("ID"), reverse=False)#kjo esht lista 
    s=''
    for x in matches:  
        note=str(x.note)
        pos=note.find(' ')
        notePos=note.find(' ', pos+1, len(note)) #Position for uppercase words in Note
        output=template.render(match=x, tab=tab, newLine='\n', Logics=logics, notePos=notePos)
        fileGeneratedDestination =output_path
        fileGeneratedCount=fileGeneratedCount+1
        filename =str( events.fullChampResults.championshipCode) +str(fileGeneratedCount)+'.tnz'
        name[fileGeneratedCount]= filename
        Logics.createFile(fileGeneratedDestination+filename, output.encode('utf-8'))

        s=json.dumps(name)
    print (s)    
if __name__ == "__main__":
    import sys
    main(sys.argv)

