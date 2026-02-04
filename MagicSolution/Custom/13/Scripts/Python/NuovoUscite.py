
# -*- coding: utf-8 -*-

import os
from Sport import Logics
from os import path
import json
import operator
from operator import attrgetter
def main(argv):
    import sys
    filepath = sys.argv[1]#"C:\\Users\\Equinox4\\source\\repos\\PythonApplication2\\PythonApplication2\\newXml.xml"
    output_path = sys.argv[2]#"C:\\Users\\Equinox4\\Desktop\\PythonFiles\\"
    fileExtension = sys.argv[4]#".txt"
    templateScript= sys.argv[5]#"test.txt" 
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
    logics= LogicsExtended()#Logics()
    name={}
    fileGeneratedCount=0
    fullChampResultAndClassification = FullChampResultsAndClassification.createFullChampResultsAndClassificationFromXmlNode(root) 
    tab='\t'
    newline='\n'
    a='ª'
    testlist=list()
    if  hasattr(fullChampResultAndClassification.fullChampResults.getLastWeekPlayed(), 'matches'):
        for match in fullChampResultAndClassification.fullChampResults.getLastWeekPlayed().matches.resultList:
            match.totalGoals.extend(match.teamA.goalsList)
            match.totalGoals.extend(match.teamB.goalsList)
            match.totalGoals.sort(key = lambda ele : int(ele.minute))#sorted(match.totalGoals, key=attrgetter('minute')) 
    output= template.render(fullChampResultAndClassification=fullChampResultAndClassification,logics=logics,tab=tab,newline=newline, a=a, multipleGoalsPlayer=testlist)#, specialChar=specialChar)
    fileGeneratedDestination =output_path #"C:\Users\Equinox3\Desktop\PythonFiles\\"
    fileGeneratedCount=fileGeneratedCount+1
    filename = str(fullChampResultAndClassification.fullChampResults.championshipCode)+'.txt'
    name[fileGeneratedCount]= filename
    Logics.createFile(fileGeneratedDestination+filename, output.encode('utf-8'))
    s=json.dumps(name)              
    print (s)
    print (output)


class LogicsExtended(Logics):

    @staticmethod
    def multipleGoals(match):
        logics = Logics()
        multipleGoalsPlayer=list()  # a list to store the name of player that has scored multiple goals
        if match.anomalyDescription is not None:        # if there is an amonaly return the result since there is no goal
            return match.anomalyDescription
        elif not hasattr( match.teamA,'goals') or not hasattr (match.teamB, 'goals'):
            return
        else:
            goalsInfo =str(match.teamA.goals)+'-'+str(match.teamB.goals)+' '            #create a variable to store the goals info and append to it the goals of each team
            if len(match.totalGoals)>0: # if there is scored more than 1 goal in the match
                for goal in match.totalGoals:    # loop throught goals 
                    if goal.part =='1' and goal.player.nameToWrite not in multipleGoalsPlayer:        # if the goal is scored in the first part and the player is not displayed before (is not stored in the multipleGoalsList)
                        goalsInfo=goalsInfo+goal.minute+'\' pt'+ (' rig.' if goal.penalty=='1' else '')+ (' aut.' if goal.autogol=='1' else '')                            # append the goal's minute and part (first part)
                        for  multipleGoals in match.totalGoals:                                     # loop again througth goals of the current match 
                            if goal.player and goal.player.nameToWrite == multipleGoals.player.nameToWrite and goal.minute !=multipleGoals.minute:  # check if there if another goal scored by the same player that is currenty at parent loop
                                goalsInfo=goalsInfo+', '+multipleGoals.minute+'\' '+ logics.getPartTime(multipleGoals.part)+ (' rig.' if goal.penalty=='1' else '')+ (' aut.' if goal.autogol=='1' else '')              # if scored another goal from the same player append the info of the other goal
                                multipleGoalsPlayer.append(multipleGoals.player.nameToWrite)                # add the player name to the list that stores the names of player with multiple goals
                        goalsInfo=goalsInfo+' '+goal.player.nameToWrite + ('('+goal.team[:1]+')' if match.teamA.goalsList>0 and match.teamB.goalsList>0 and hasattr(goal, 'team') else '')+', '# after exiting the parent chilf loop append the name of the player and if both teams have scored, first character of his team
                if len(goalsInfo)>6:
                  goalsInfo=goalsInfo[:(len(goalsInfo)-2)]+';'
                for goal in match.totalGoals:   
                    if goal.part =='2' and goal.player.nameToWrite not in multipleGoalsPlayer:        # if the goal is scored in the second part and the player is not displayed before (is not stored in the multipleGoalsList)
                        goalsInfo=goalsInfo+goal.minute+'\' st'+ (' rig.' if goal.penalty=='1' else '')+ (' aut.' if goal.autogol=='1' else '')                                    # append the goal's minute and part (second part)
                        for  multipleGoals in match.totalGoals:                                     # loop again througth goals of the current match 
                            if goal.player.nameToWrite == multipleGoals.player.nameToWrite and goal.minute !=multipleGoals.minute:  # check if there if another goal scored by the same player that is currenty at parent loop
                                goalsInfo=goalsInfo+', '+multipleGoals.minute+'\' '+ logics.getPartTime(multipleGoals.part)+ (' rig.' if goal.penalty=='1' else '')+ (' aut.' if goal.autogol=='1' else '')               # if scored another goal from the same player append the info of the other goal
                                multipleGoalsPlayer.append(multipleGoals.player.nameToWrite)                # add the player name to the list that stores the names of player with multiple goals
                        goalsInfo=goalsInfo+' '+goal.player.nameToWrite + ('('+goal.team[:1]+')' if match.teamA.goalsList>0 and match.teamB.goalsList>0 and hasattr(goal, 'team') else '')+', '# after exiting the parent chilf loop append the name of the player and  if both teams have scored , the first character of his team
            if goalsInfo[len(goalsInfo)-2] != ',':  # check if the last character is a comma
                return goalsInfo                    #return the variable like it is if there is no comma in the end
            else:
                return goalsInfo[:(len(goalsInfo)-2)]   # or variable without the comma



if __name__ == "__main__":
    import sys
    main(sys.argv)