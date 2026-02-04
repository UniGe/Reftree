from os import path
class WeekResults:
    def __init__(self,*args, **kwargs):
        vars = dict( *args, **kwargs)
        if "week" in vars:
             self.week= vars['week']
        if "event_date" in vars:
             self.event_date= vars['event_date']
        if "singleTeam" in vars:
             self.singleTeam= vars['singleTeam']
        if "weekMatchDate" in vars:
             self.weekMatchDate= vars['weekMatchDate']
        if "nextWeekSingleTeam" in vars:
             self.nextWeekSingleTeam = vars['nextWeekSingleTeam']
        if "nextMatchDate" in vars:
             self.nextMatchDate = vars['nextMatchDate']
        if "matchDay" in vars:
             self.matchDay = vars['matchDay']
        if "matchMonth" in vars:
             self.matchMonth = vars['matchMonth']
        if "nextWeek" in vars:
             self.nextWeek = vars['nextWeek']
        if "weekDate" in vars:
             self.weekDate = vars['weekDate']
        if "firstMatchTeamAGoal" in vars:
             self.firstMatchTeamAGoal= vars['firstMatchTeamAGoal']
        if "firstMatchTeamBGoal" in vars:
             self.firstMatchTeamBGoal= vars['firstMatchTeamBGoal']
        
        
        matches = list()
    @staticmethod 
    def createWeekResultsFromXmlNode(eventNode, *args, **kwargs):
        vars = dict(*args, **kwargs)
        if "nextWeekMatches" in vars and vars['nextWeekMatches']==True:
            event = WeekResults( week=eventNode.get('nextWeek') , weekMatchDate = eventNode.get('WeekMatchDate') ,singleTeam = eventNode.get('SingleTeam'),nextWeekSingleTeam =eventNode.get('NextWeekSingleTeam'),nextMatchDate=eventNode.get('nextMatchDate'),nextWeek=eventNode.get('nextWeek'),  matchDay=eventNode.get('day_match'), matchMonth=eventNode.get('month_match'))
            fullResult = CompleteResult.createFullResultFromXmlNode(eventNode, nextWeekMatches = True)
            event.nextWeekMatches = fullResult
            return event

        event = WeekResults( week=eventNode.get('week') , weekMatchDate = eventNode.get('WeekMatchDate') ,singleTeam = eventNode.get('SingleTeam'),nextWeekSingleTeam =eventNode.get('NextWeekSingleTeam'), weekDate=eventNode.get('weekDate'),firstMatchTeamAGoal=eventNode.get("firstMatchTeamAGoal"),firstMatchTeamBGoal=eventNode.get("firstMatchTeamBGoal"))
        fullResult = CompleteResult.createFullResultFromXmlNode(eventNode)
        event.matches = fullResult
        return event#1

class Match :
        
    def __init__(self,teamA, teamB,  *args, **kwargs):
        """
        Parameters:
        Team1
        Team2
        Referee
	    MatchDate
	    Anomaly_ID
	    Anomaly_Description	
        """
        vars = dict(*args, **kwargs)
        self.teamA= teamA
        self.teamB= teamB
        if "ID" in vars : 
             self.ID= vars ['ID'] 
        if "matchDate" in vars : 
             self.matchDate= vars ['matchDate'] 
        if "matchDay" in vars : 
             self.matchDay= vars ['matchDay'] 
        if "matchMonth" in vars : 
             self.matchMonth= vars ['matchMonth'] 
        if "matchTime" in vars :
            self.matchTime= vars ['matchTime']
        if "referee" in vars : 
             self.referee= vars ['referee']  
        if "refereeWebsite" in vars:
             self.refereeWebsite= vars['refereeWebsite']
        if "refereeVote" in vars:
             self.refereeVote= vars['refereeVote']
        if "anomalyID" in vars:
             self.anomalyID=vars ['anomalyID']
        if "anomalyDescription" in vars:
             self.anomalyDescription= vars ['anomalyDescription']
        if "note" in vars : 
             self.note= vars ['note']
        if "recovery1T" in vars:
             self.recovery1T= vars['recovery1T']
        if "recovery2T" in vars:
             self.recovery2T= vars['recovery2T']
        if "firstMatchTeamAGoal" in vars:
             self.firstMatchTeamAGoal= vars['firstMatchTeamAGoal']
        if "firstMatchTeamBGoal" in vars:
             self.firstMatchTeamBGoal= vars['firstMatchTeamBGoal']
        if (teamA.name[:1]!=teamB.name[:1]):
            teamA.alias=teamA.name[:1]
            teamB.alias=teamB.name[:1]
        else:
            teamA.alias=teamA.name[:2]
            teamB.alias=teamB.name[:2]
        self.totalGoals=list();
        self.totalPlayers=list();

    @staticmethod
    def createMatchFromXmlNode (resultNode): 
        for teamANode in resultNode.iter('TeamA'):
            teamA = Team.createTeamFromXmlNode(teamANode)
        for teamBNode in resultNode.iter('TeamB'):
            teamB = Team.createTeamFromXmlNode(teamBNode)
        totalPlayers=list();
        totalPlayers.extend(teamA.playersList)#.extend(teamB.playersList)
        totalPlayers.extend(teamB.playersList)
        teamA.goalsList= Team.associatePlayersToGoals (teamA.goalsList, totalPlayers)
        teamB.goalsList= Team.associatePlayersToGoals (teamB.goalsList, totalPlayers)
        match=Match(teamA, teamB,ID= resultNode.get('match_ID'), matchDate=resultNode.get('date_match'),matchDay=resultNode.get('day_match'),matchMonth=resultNode.get('month_match'), matchTime=resultNode.get('time_match'), firstMatchTeamAGoal=resultNode.get("firstMatchTeamAGoal"),firstMatchTeamBGoal=resultNode.get("firstMatchTeamBGoal"),referee=resultNode.get('referee'), refereeWebsite=resultNode.get('refereeWebsite'), refereeVote=resultNode.get('refereeVote'),anomalyID=resultNode.get('anomaly_id'), anomalyDescription=resultNode.get('anomaly_description'), note=resultNode.get('Note').encode('utf-8') if resultNode.get('Note') != None else '')
        match.totalPlayers=totalPlayers
        match.totalGoals=teamA.goalsList
        match.totalGoals.extend(teamB.goalsList)
        match.totalGoals.sort(key = lambda ele : (int(ele.part), int(ele.minute)))
        return match  #2
    
class Goal:
    def __init__(self,*args,**kwargs):
        """
        Parameters:
        PlayerID
        Minute
        Autogoal (boolean)
        """
        vars = dict(*args, **kwargs)
        if "player" in vars:
             self.player= vars['player']
        if "minute" in vars:
             self.minute= vars['minute'] 
        if "part" in vars:
             self.part= vars['part']
        if "penalty" in vars:
             self.penalty= vars['penalty']
        if "autogoal" in vars:
             self.autogoal= vars['autogoal']
        if "team" in vars:
            self.team= vars['team']
        if "player_ID" in vars:
            self.player_ID= vars['player_ID']
        if "proTeam" in vars :
            self.proTeam = vars['proTeam']
        if "againstTeam" in vars: 
            self.againstTeam = vars['againstTeam']
    @staticmethod
    def createGoalFromXmlNode(goalNode , player_ID, team):
        goal = Goal( player_ID=player_ID,player=Player(lastName=goalNode.get('LastName'),firstName=goalNode.get('FirstName')), team=team ,minute = goalNode.get('minute'),part =goalNode.get('part'),penalty =goalNode.get('Penalty') ,autogoal = goalNode.get('OwnGoal') , proTeam = goalNode.get('NomeSquadraPro'),againstTeam = goalNode.get('NomeSquadraContro')  )
        
        return goal

class Team:

    def __init__(self,*args, **kwargs):
        """
        Parameters:
        Name
        Goals
        Points
        Played
        Won
        Even
        Lost
        GF
        GS
        EnglishMedia
		Referee
		Module
        anomalyID
        anomalyDescription
        Penality
		Alternative Name
        Sub
        """

        vars = dict( *args, **kwargs)
       
        
        if "ID" in vars:
             self.ID= vars['ID']
        if "name" in vars:
             self.name= vars['name']
        if "goals" in vars:
            if vars['goals'] is not None:
                self.goals= int(vars['goals'])
        if "expelled" in vars:
             self.expelled= vars['expelled']
        if "points" in vars:
             self.points= vars['points']
        if "played" in vars:
             self.played= vars['played']
        if "playedHome" in vars:
             self.playedHome= vars['playedHome']
        if "pointsOutside" in vars:
             self.pointsOutside= vars['pointsOutside']
        if "playedOutside" in vars:
             self.playedOutside= vars['playedOutside']
        if "won" in vars:
             self.won= vars['won']
        if "even" in vars:
             self.even= vars['even']
        if "lost" in vars:
             self.lost= vars['lost']
        if "lostOutside" in vars:
             self.lostOutside= vars['lostOutside']
        if "wonOutside" in vars:
             self.wonOutside= vars['wonOutside']
        if "evenOutside" in vars:
             self.evenOutside= vars['evenOutside']			 
        if "gF" in vars:
             self.gF= vars['gF']
        if "gS" in vars:
             self.gS= vars['gS']
        if "pointsHome" in vars:
             self.pointsHome= vars['pointsHome']
        if "wonHome" in vars:
             self.wonHome= vars['wonHome']
        if "evenHome" in vars:
             self.evenHome= vars['evenHome']
        if "lostHome" in vars:
             self.lostHome= vars['lostHome']
        if "gFHome" in vars:
             self.gFHome= vars['gFHome']
        if "gSHome" in vars:
             self.gSHome= vars['gSHome']
        if "gFOutside" in vars:
             self.gFOutside= vars['gFOutside']
        if "gSOutside" in vars:
             self.gSOutside= vars['gSOutside']
        if "englishMedia" in vars:
             self.englishMedia= vars['englishMedia']
        if "corner" in vars:
             self.corner= vars['corner']
        if "recoveryT" in vars:
             self.recoveryT= vars['recoveryT']
        if "audience" in vars:
             self.audience= vars['audience']
        if "coachVoto" in vars:
             self.coachVoto= vars['coachVoto']		
        if "module" in vars:
             self.module= vars['module']
        if "coach" in vars:
             self.coach= vars['coach']
        if "penality" in vars : 
             self.penality= vars ['penality']
        if "alternativeName" in vars : 
             self.alternativeName= vars ['alternativeName']
        if"points_previous_year" in vars :
            self.points_previous_year= vars ['points_previous_year']
        if"penalty_own_total" in vars :
            self.penalty_own_total= vars ['penalty_own_total']
        if"penalty_own_scored" in vars :
            self.penalty_own_scored= vars ['penalty_own_scored']
        if"penalty_opponent_total" in vars :
            self.penalty_opponent_total= vars ['penalty_opponent_total']
        if"penalty_opponent_scored" in vars :
            self.penalty_opponent_scored= vars ['penalty_opponent_scored']
        self.alias=None #variable to be used when needed to indicate team by first character
             

        self.playersList=list()
        self.goalsList = list()
        self.hasPlayersInDispostion = False
        self.yellowCardNumber=0
        self.redCardNumber=0

    def addPlayer (self, player):
        if player.inDisposition == True:
            self.hasPlayersInDispostion = True
        if hasattr(player, 'yellowCardMinute'):
            if player.yellowCardMinute is not None:
                self.yellowCardNumber=self.yellowCardNumber+1
        if hasattr(player, 'redCardMinute'):
            if player.redCardMinute is not None:
                self.redCardNumber=self.redCardNumber+1
        self.playersList.append(player)
    def addGoal (self, goal):
        self.goalsList.append(goal)
    @staticmethod
    def createTeamFromXmlNode (teamNode):
         team = Team (ID =teamNode.get('match_ID'), name = teamNode.get('Name'), goals=teamNode.get('Goals'),  coach=teamNode.get('Coach'), coachVoto=teamNode.get('CoachVoto'),
                     module=teamNode.get('Module'),points=teamNode.get('Punti'),played=teamNode.get('Giocate'),won=teamNode.get('Vinte'),even=teamNode.get('Pari'),
                     lost=teamNode.get('Perse'),gF=teamNode.get('GF'),gS=teamNode.get('GS'),pointsHome=teamNode.get('PuntiCasa'),playedHome=teamNode.get('GiocateCasa'),
                     wonHome=teamNode.get('VinteCasa'),evenHome=teamNode.get('PariCasa'),lostHome=teamNode.get('PerseCasa'),gFHome=teamNode.get('GFCasa'),gSHome=teamNode.get('GSCasa'),
                     pointsOutside=teamNode.get('PuntiFuori'),playedOutside=teamNode.get('GiocateFuori'),wonOutside=teamNode.get('VinteFuori'),evenOutside=teamNode.get('PariFuori'),
                     lostOutside=teamNode.get('PerseFuori'),gFOutside=teamNode.get('GFFuori'),gSOutside=teamNode.get('GSFuori'),englishMedia=teamNode.get('MediaInglese') , penality=  teamNode.get('Penalita'), 
                     points_previous_year=teamNode.get ('Points_Previous_Year'), penalty_opponent_total=teamNode.get('Penalty_Opponent_Total'), penalty_opponent_scored=teamNode.get('Penalty_Opponent_Scored'), 
                     penalty_own_total=teamNode.get('Penalty_Own_Total'), penalty_own_scored=teamNode.get('Penalty_Own_Scored'))
         #TODO corners in team node
         for playerNode in teamNode.iter('Player'):

             player = Player.createPlayerFromXmlNode(playerNode=playerNode , team=team.name, substitute=False, substitute2=False, inDisposition=False)#kjo do bohet tek team
             team.addPlayer(player)
             if player.substitute is not None: 
                 team.addPlayer(player.substitute)
                 if player.substitute.substitute is not None: 
                     team.addPlayer(player.substitute.substitute)
                    
             

         for inDisposition in teamNode.iter('PlayersInDisposition'):
                player = Player.createPlayerFromXmlNode(inDisposition , team=team.name, substitute=False , substitute2=False, inDisposition=True)
                team.addPlayer(player)
         team.setSameNamePlayers("F. LastName")
         for goalNode in teamNode.iter('Goal'):
             #goal = Goal.createGoalFromXmlNode(goalNode , Team.getPlayerFromList( team.playersList, goalNode.get('LastName') , goalNode.get('FirstName') ),team.name )
             goal = Goal.createGoalFromXmlNode(goalNode , goalNode.get('Player_ID') ,team.name )
             team.addGoal(goal)
         return team 
    @staticmethod
    def getPlayerFromList( playersList , lastName , firstName ):
        for player in playersList:
            if player.firstName == firstName and player.lastName == lastName:
                return player

    def setSameNamePlayers (self , nameType):
        """
        NameType : "L. FirstName" (if FirstName duplicated)
        NameType : "F. LastName" (if LastName duplicated)
		"""
        duplicatedNames = list ()
        tempList = list()
        if nameType ==  "F. LastName":

            for x in self.playersList:
                if (x.lastName not in tempList):
                    tempList.append(x.lastName)
                else:
                    duplicatedNames.append(x.lastName)
            for x in self.playersList:
                if x.lastName in duplicatedNames:
                    x.nameToWrite = x.firstName[:1] + ". "+x.lastName
                else : 
                    x.nameToWrite = x.lastName#4

    @staticmethod
    def associatePlayersToGoals(totalGoals, totalPlayers):
        for goal in totalGoals:
            for player in totalPlayers:
                if goal.player_ID==player.player_ID:
                    goal.player=player
        return totalGoals

class Player:
    def __init__ (self,*args,**kwargs):
	"""
	Parameters
	LastName
	FirstName
	Number
	Vote
	YellowCardMinute
    YellowCardPart
	RedCardMinute
    RedCardPart
	replacedBy
	replacedTime
	replacedPart
    NameToWrite
	"""
    	vars = dict(*args, **kwargs)	
        if "lastName" in vars:
		    self.lastName=vars['lastName']
        if "firstName" in vars:
        	self.firstName=vars['firstName']
        if "number" in vars:
        	self.number=vars['number']
        if "vote" in vars:
        	self.vote=vars['vote']
        if "yellowCardMinute" in vars:
            self.yellowCardMinute=vars['yellowCardMinute']
        if "yellowCardPart" in vars:
            self.yellowCardPart= vars['yellowCardPart']
        if "redCardMinute" in vars:
            self.redCardMinute=vars['redCardMinute']
        if "redCardPart" in vars:
            self.redCardPart= vars ['redCardPart']
        if "replacedTime" in vars:#kjo do rri
            self.replacedTime=vars['replacedTime']
        if "replacedPart" in vars:
            self.replacedPart=vars['replacedPart']
        if "nameToWrite" in vars: 
            self.nameToWrite = vars['nameToWrite']
        if "played" in vars :#ky do jet bit 1 kur e fut tek lista par
            self.played =  vars['played']
        if "substitute" in vars: 
            self.substitute =  vars['substitute']
        #if "substitute2" in vars: 
        #    self.substitute2 =  vars['substitute2']
        if "inDisposition" in vars: 
            self.inDisposition =  vars['inDisposition']
        if "isSubstituted" in vars: 
            self.isSubstituted =  vars['isSubstituted']
        if "player_ID" in vars:
            self.player_ID= vars['player_ID']
        if "team" in vars:
            self.team=vars["team"]
    
    @staticmethod
    def createPlayerFromXmlNode ( playerNode,team, substitute, substitute2, inDisposition ):
        if substitute is False and inDisposition is False and substitute2 is False:
             player= Player(lastName=playerNode.get('LastName'), firstName=playerNode.get('FirstName'),team=team, vote=playerNode.get('Vote'), number= int(playerNode.get('Number')), player_ID= playerNode.get('Player_ID'),replacedTime=playerNode.get('replacedTime'), replacedPart=playerNode.get('replacedPart'), yellowCardMinute=playerNode.get('YellowCardMinute'), yellowCardPart=playerNode.get('YellowCardPart'),redCardMinute=playerNode.get('RedCardMinute'), redCardPart=playerNode.get('RedCardPart') , played=True, inDisposition = False)
             player.substitute =  Player.createPlayerFromXmlNode(playerNode ,team=team, substitute=True ,substitute2=False ,inDisposition= False)
             return player 
        elif substitute is True and (playerNode.get('replacedByLastName') is not None or  playerNode.get('replacedByFirstName') is not None) :
            player =  Player(lastName=playerNode.get('replacedByLastName') , firstName=playerNode.get('replacedByFirstName') ,team=team, player_ID= playerNode.get('replacedByID'),vote=playerNode.get('replacedVote'), number=int (playerNode.get('replacedPlayerNumber')), yellowCardMinute = playerNode.get('replacedPlayerYellowCard') , yellowCardPart = playerNode.get('replacedPlayerYellowCardPart') ,redCardMinute=playerNode.get('replacedPlayerRedCard'), redCardPart=playerNode.get('replacedPlayerRedCardPart') ,isSubstituted= True,  substitute=True ,inDisposition = False)
            player.substitute= Player.createPlayerFromXmlNode(playerNode,team=team, substitute=False , substitute2=True ,inDisposition= False)
            return player
        elif substitute2 is True and (playerNode.get('replacedByLastName2') is not None or  playerNode.get('replacedByFirstName2') is not None) :
            player =  Player(lastName=playerNode.get('replacedByLastName2') , firstName=playerNode.get('replacedByFirstName2') ,team=team, player_ID= playerNode.get('replacedByID2'),vote=playerNode.get('replacedVote2'), number=int (playerNode.get('replacedPlayerNumber2')),replacedTime=playerNode.get('replacedTime2'), replacedPart=playerNode.get('replacedPart2'), yellowCardMinute = playerNode.get('replacedPlayerYellowCard2') , yellowCardPart = playerNode.get('replacedPlayerYellowCardPart2') ,redCardMinute=playerNode.get('replacedPlayerRedCard2'), redCardPart=playerNode.get('replacedPlayerRedCardPart2'), substitute=False ,substitute2=True ,inDisposition = False)
            return player
        elif inDisposition is True : 
            player =  Player(lastName=playerNode.get('LastName'), firstName=playerNode.get('FirstName'),team=team,number= int(playerNode.get('Number')), player_ID= playerNode.get('Player_ID'),substitute = False , inDisposition= True)
            return player
        return None#5

class CompleteResult:
    def __init__ (self,*args,**kwargs):
	"""
	Parameters
	"""
        self.resultList = list()
    def addResult(self,result):
        self.resultList.append(result)
    @staticmethod
    def createFullResultFromXmlNode(fullResultNode , *args , **kwargs):
        vars = dict(*args, **kwargs)	
        completeResult= CompleteResult()
        if "nextWeekMatches" in vars and vars['nextWeekMatches']==True:
             for resultNode in fullResultNode.findall('DayMatches'):
                 result = Match.createMatchFromXmlNode(resultNode)
                 completeResult.addResult(result)


        for resultNode in fullResultNode.findall('result'):
             result = Match.createMatchFromXmlNode(resultNode)
             completeResult.addResult(result)
        return completeResult#6

class CompleteClassification:
	


    def __init__(self):
        """
        Parameters
        classificationList
        """

        self.classificationList=list()
    def addTeam(self, team):
        self.classificationList.append(team)
    @staticmethod
    def createClassificationFromXmlNode (classificationNode):
        classification = CompleteClassification()
        for teamNode in classificationNode.findall('Squadra'):
                team=Team.createTeamFromXmlNode(teamNode)
                classification.addTeam(team)
        return classification  #7      
	
class FullChampResults:
	

    def __init__(self,*args, **kwargs):
        """
	    Parameters
	    ChampResultList
	    """
    	vars = dict(*args, **kwargs)	

        if "championshipID" in vars:
             self.championshipID= vars['championshipID']
        if "season" in vars:
             self.season= vars['season']
        if "category" in vars:
             self.category= vars['category']
        if "round" in vars:
             self.round= vars['round']
        if "singleMatch" in vars:
            self.singleMatch= vars['singleMatch']
        if "fromDate" in vars:
            self.fromDate= vars['fromDate']
        if "toDate" in vars:
            self.toDate= vars['toDate']
        if "singleTeam" in vars:
            self.singleTeam= vars['singleTeam']
        if "nextWeekSingleTeam" in vars:
            self.nextWeekSingleTeam= vars['nextWeekSingleTeam']
        if "weeks" in vars:
            self.weeks= vars['weeks']
        if "championshipCode" in vars:
            self.championshipCode= vars['championshipCode']
        if "organisation" in vars:
            self.organisation = vars['organisation']
        self.champResultList=list()
    def addChampResult(self, champResult):
        self.champResultList.append(champResult)
    
    def getLastWeekPlayed(self):
        maxList = None
        for resultList in self.champResultList: 
            if maxList is None or int(resultList.week) > int(maxList.week):
                maxList = resultList
        return maxList
    @staticmethod
    def createFullChampResultsFromXmlNode (eventsNode):
        fullChampResults = FullChampResults( category = eventsNode.get('categoria') , round= eventsNode.get('girone'),fromDate=  eventsNode.get('FromDate') , toDate = eventsNode.get('ToDate') , championshipCode = eventsNode.get('ChampionshipCode'), organisation = eventsNode.get('Organisation'))
        for event in eventsNode.findall('Event'):
            fullResult = WeekResults.createWeekResultsFromXmlNode(event)
            fullChampResults.addChampResult(fullResult)
        for nextWeekMatchesNode in  eventsNode.findall('NextMatches'):
            nextWeekMatches = WeekResults.createWeekResultsFromXmlNode(nextWeekMatchesNode , nextWeekMatches = True, nextMatchDate=nextWeekMatchesNode.get('nextMatchDate'))
            fullChampResults.nextWeekMatches = nextWeekMatches
        return fullChampResults#8

class FullChampResultsAndClassification:
    def __init__ (self):
        self.fullChampResults=None
        self.classification = None
        self.scorer = None
    @staticmethod
    def createFullChampResultsAndClassificationFromXmlNode(completeEventsXml):
        fCRAC = FullChampResultsAndClassification()
        for eventsNode in completeEventsXml.iter('Events'):#looping through events(championships)
            fullChampResults = FullChampResults.createFullChampResultsFromXmlNode(eventsNode)#a specific championship might have different weeks and results
        for classificationNode in completeEventsXml.iter('Classifica'): #getting the node of the classification of the championship we're looping through
            classif = CompleteClassification.createClassificationFromXmlNode(classificationNode)# a specific championship will have one and only one classification
        fCRAC.fullChampResults=fullChampResults
        fCRAC.classification = classif
        scorer = Scorer()
        scorer.createScorerFromXmlNode(completeEventsXml)
        fCRAC.scorer = scorer
        
        return fCRAC#9

class Logics:
        
    def getPartTime (self, partNumber):
        if (partNumber=="1"):
            return "pt"
        elif(partNumber=="2"):
            return "st"
    def exist (self, param):
        if param is None :
            return False
        else:
            return True
    @staticmethod
    def createFile (outputLocation,  output):
        #if not (path.isfile(outputLocation)):
        f=open(outputLocation, 'w')
        f.write(output.encode('utf-8'))
        f.close

    @staticmethod
    def changeTeamName (filepath, oldName, newName):
        import xml.etree.ElementTree as ET
        with open(filepath, 'r') as f:
            tree = ET.parse(f)

        for n in tree.findall(".//"):
            for a in n.attrib:
                n.attrib[a] = n.attrib[a].replace(oldName,newName)
        with open(filepath, 'w') as f:
            tree.write(f)
        return tree.getroot()
			
   
   
    
    #@staticmethod
    #def createTeam(self, teamNode):
    #    #self.team = Team()
    #    return team
            
            
    @staticmethod
    def createResult(self , resultNode):
            #result = Match()
            #goalsList=CompleteGoal()
            teamA = Team ( ID =resultNode.get('match_ID'), name = resultNode.get('team_a'), goals=resultNode.get('goal_a'),  coach=resultNode.get('Coach1'), module=resultNode.get('Module1'))
            teamB = Team ( ID =resultNode.get('match_ID'), name = resultNode.get('team_b'), goals=resultNode.get('goal_b'),  coach=resultNode.get('Coach2'), module=resultNode.get('Module2'))
            totalGoals= int(teamA.goals)+int(teamB.goals)
            for teamANode in resultNode.iter('TeamA'):
                for playerNode in teamANode.findall('Players'):
                    replaced = False
                    if playerNode.get('replacedBy') is not None:
                        substitutePlayer = Player (lastName=playerNode.get('replacedByLastName'), firstName=playerNode.get('replacedByFirstName'))
                        teamA.addPlayer(substitutePlayer)
                        replaced = true
                    player= Player (lastName=playerNode.get('LastName'), firstName=playerNode.get('FirstName'),vote=playerNode.get('Vote'), replacedBy=playerNode.get('replacedBy'),replacedTime=playerNode.get('replacedTime'), replacedPart=playerNode.get('replacedPart'), replacedVote=playerNode.get('replacedVote'), yellowCardMinute=playerNode.get('YellowCardMinute'), yellowCardPart=playerNode.get('YellowCardPart'),redCardMinute=playerNode.get('RedCardMinute'), redCardPart=playerNode.get('RedCardPart') , playerNode=True)
                    teamA.addPlayer(player)
            for goalsNode in resultNode.iter('Goals'):
                for goalSubNode in goalsNode.findall('Goal'):
                    goal=Goal(lastName=goalSubNode.get('Player'), minute=goalSubNode.get('minute'), part=goalSubNode.get('part'), penalty=goalSubNode.get('Penalty'), autogoal=goalSubNode.get('OwnGoal'))
                    goalsList.addGoal(goal)
            for dispositionANode in resultNode.iter('InDispositionTeamA'):
                for playerAInDispositionNode in dispositionANode.findall('InDisposition'):
                    inDisposition= Player(lastName=playerAInDispositionNode.get('LastName'), firstName=playerAInDispositionNode.get('FirstName'))
                    teamA.addinDispositionPlayer(inDisposition)
            for TeamBNode in resultNode.iter('TeamB'):
                for playerNode in TeamBNode.findall('Players'):
                    player= Player (LastName=playerNode.get('LastName'), FirstName=playerNode.get('FirstName'),Vote=playerNode.get('Vote'),replacedBy=playerNode.get('replacedBy'),replacedTime=playerNode.get('replacedTime'), replacedPart=playerNode.get('replacedPart'), replacedVote=playerNode.get('replacedVote'), YellowCardMinute=playerNode.get('YellowCardMinute'), YellowCardPart=playerNode.get('YellowCardPart'),RedCardMinute=playerNode.get('RedCardMinute'), RedCardPart=playerNode.get('RedCardPart'))
                    teamB.addPlayer(player)
            for dispositionBNode in resultNode.iter('InDispositionTeamB'):
                for playerBInDispositionNode in dispositionBNode.findall('InDisposition'):
                    inDisposition= Player(lastName=playerBInDispositionNode.get('LastName'), firstName=playerAInDispositionNode.get('FirstName'))
                    teamB.addinDispositionPlayer(inDisposition)

            return result

class checkTeamName: #kjo duhej statike e di e di esht e vjetra
    def checkName(self, teamName):
        if teamName == 'Legnano 1913':
            return 'Legnano'
        elif teamName == 'Union Arzignanochiampo':
            return 'U. Arzignano'
        elif teamName == 'Virtus Verona':
            return 'Virtus Vecomp Vr'
        elif teamName == 'S. Donato T.':
            return 'San Donato T.'
        elif teamName == 'C. di Castello':
            return 'Citta di Castello'
        elif teamName == 'Vultur':
            return 'Vultur Rionero'
        else:
            return teamName

  #      class Championship: 
		
  #  def __init__(self,*args, **kwargs):
  #      """
  #      Parameters:
  #      ChampionshipID
  #      Season
  #      Category 
		#Round
		#SingleMatch
		#SingleTeam
		#NextWeekSingleTeam
  #      Weeks
		
		#"""
       
  #      vars = dict(*args, **kwargs)
  #      if "championshipID" in vars:
  #           self.championshipID= vars['championshipID']
  #      if "season" in vars:
  #           self.season= vars['season']
  #      if "category" in vars:
  #           self.category= vars['category']
  #      if "round" in vars:
  #           self.round= vars['round']
  #      if "singleMatch" in vars:
  #          self.singleMatch= vars['singleMatch']
  #      if "fromDate" in vars:
  #          self.fromDate= vars['fromDate']
  #      if "toDate" in vars:
  #          self.toDate= vars['toDate']
  #      if "singleTeam" in vars:
  #          self.singleTeam= vars['singleTeam']
  #      if "nextWeekSingleTeam" in vars:
  #          self.nextWeekSingleTeam= vars['nextWeekSingleTeam']
  #      if "weeks" in vars:
  #          self.weeks= vars['weeks']
  #      if "championshipCode" in vars:
  #          self.championshipCode= vars['championshipCode']
  #      self.teams=list()

  #  def addTeam(self,team):
  #      self.teams.append(team)
  #  def sortList (self):
  #      self.teams=sorted(sorted(sorted(sorted(self.teams, key=lambda team: team.gF, reverse=True), key=lambda yeam: yeam.dG, reverse=True), key=lambda team: team.played, reverse=True), key=lambda team: team.points, reverse=True)


class ChampionshipStatistics:
    def __init__ (self,*args,**kwargs):
        vars = dict(*args, **kwargs)	
        if "code" in vars:
            self.code=vars['code']
        self.teamStatisticsList=list()
    def addTeam (self,team):
        self.teamStatisticsList.append(team)
    @staticmethod
    def createChampionshipStatisticsFromXML (root):
        championship=ChampionshipStatistics(code=root.get('Code'))
        for teamNode in root.findall('Team') :
            team=TeamStatistics.createTeamStatisticsFromXML(teamNode)
            championship.addTeam(team)
        return championship


class TeamStatistics:
    def __init__ (self,*args,**kwargs):
        vars = dict(*args, **kwargs)	
        if "name" in vars:
            self.name=vars['name']
        if "gF" in vars:
            self.gF=vars['gF']
        if "gS" in vars:
            self.gS=vars['gS']
        if "autogoal" in vars:
            self.autogoal=vars['autogoal']
        if "gF_Penalty" in vars:
            self.gF_Penalty=vars['gF_Penalty']
        if "gS_Penalty" in vars:
            self.gS_Penalty=vars['gS_Penalty']
        if "gF_FirstPart" in vars:
            self.gF_FirstPart=vars['gF_FirstPart']
        if "gF_SecondPart" in vars:
            self.gF_SecondPart=vars['gF_SecondPart']
        if "gS_FirstPart" in vars:
            self.gS_FirstPart=vars['gS_FirstPart']
        if "gS_SecondPart" in vars:
            self.gS_SecondPart=vars['gS_SecondPart']
        if "gF_0_15" in vars:
            self.gF_0_15=vars['gF_0_15']
        if "gF_16_30" in vars:
            self.gF_16_30=vars['gF_16_30']
        if "gF_31_45" in vars:
            self.gF_31_45=vars['gF_31_45']
        if "gF_46_60" in vars:
            self.gF_46_60=vars['gF_46_60']
        if "gF_61_75" in vars:
            self.gF_61_75=vars['gF_61_75']
        if "gF_76_90" in vars:
            self.gF_76_90=vars['gF_76_90']
        if "gS_0_15" in vars:
            self.gS_0_15=vars['gS_0_15']
        if "gS_16_30" in vars:
            self.gS_16_30=vars['gS_16_30']
        if "gS_31_45" in vars:
            self.gS_31_45=vars['gS_31_45']
        if "gS_46_60" in vars:
            self.gS_46_60=vars['gS_46_60']
        if "gS_61_75" in vars:
            self.gS_61_75=vars['gS_61_75']
        if "gS_76_90" in vars:
            self.gS_76_90=vars['gS_76_90']
        if "yellowCard" in vars:
            self.yellowCard=vars['yellowCard']
        if "redCard" in vars:
            self.redCard=vars['redCard']
        if "matchCount_Adva" in vars:
            self.matchCount_Adva=vars['matchCount_Adva']
        if "won_Adva" in vars:
            self.won_Adva=vars['won_Adva']
        if "even_Adva" in vars:
            self.even_Adva=vars['even_Adva']
        if "lost_Adva" in vars:
            self.lost_Adva=vars['lost_Adva']
        if "matchCount_Disadva" in vars:
            self.matchCount_Disadva=vars['matchCount_Disadva']
        if "won_Disadva" in vars:
            self.won_Disadva=vars['won_Disadva']
        if "even_Disadva" in vars:
            self.even_Disadva=vars['even_Disadva']
        if "lost_Disadva" in vars:
            self.lost_Disadva=vars['lost_Disadva']
        self.playerStatisticsList=list()

    def addPlayer (self, player):
        self.playerStatisticsList.append(player)
    @staticmethod
    def createTeamStatisticsFromXML (teamXml):
        team=TeamStatistics(name=teamXml.get('Name'), id = teamXml.get('ID'), gF=teamXml.get('GF'), gS=teamXml.get('GS'), 
                            autogoal=teamXml.get('Autogoal'), gF_Penalty=teamXml.get('GF_Penalty'), gS_Penalty=teamXml.get('GS_Penalty'), 
                            gF_FirstPart=teamXml.get('GF_FirstPart'), gF_SecondPart=teamXml.get('GF_SecondPart'), gS_FirstPart=teamXml.get('GS_FirstPart'), 
                            gS_SecondPart =teamXml.get('GS_SecondPart'), gF_0_15=teamXml.get('GF_0_15'), gF_16_30=teamXml.get('GF_16_30'), gF_31_45=teamXml.get('GF_31_45'), 
                            gF_46_60=teamXml.get('GF_46_60'), gF_61_75=teamXml.get('GF_61_75'), gF_76_90=teamXml.get('GF_76_90'), gS_0_15=teamXml.get('GS_0_15'),
                            gS_16_30 =teamXml.get('GS_16_30'), gS_31_45=teamXml.get('GS_31_45'), gS_46_60=teamXml.get('GS_46_60'), gS_61_75=teamXml.get('GS_61_75'), 
                            gS_76_90=teamXml.get('GS_76_90'), yellowCard=teamXml.get('YellowCard'), redCard=teamXml.get('RedCard'), matchCount_Adva=teamXml.get('MatchCount_Adva'),
                            won_Adva=teamXml.get('Won_Adva'),even_Adva=teamXml.get('Even_Adva'),lost_Adva=teamXml.get('Lost_Adva'),matchCount_Disadva=teamXml.get('MatchCount_Disadva'),
                            won_Disadva=teamXml.get('Won_Disadva'),even_Disadva=teamXml.get('Even_Disadva'),lost_Disadva=teamXml.get('Lost_Disadva'))
        for playerNode in teamXml.findall('Player'):
            player=PlayerStatistics.createPlayerStatisticsFromXML(playerNode)
            team.addPlayer(player)
        return team
            

class PlayerStatistics :
    def __init__ (self,*args,**kwargs):
        vars = dict(*args, **kwargs)	
        if "id" in vars:
            self.id=vars['id']
        if "lastName" in vars:
            self.lastName=vars['lastName']
        if "playedMinutes" in vars:
        	self.playedMinutes=vars['playedMinutes']
        if "goal" in vars:
        	self.goal=vars['goal']
        if "autogoal" in vars:
            self.autogoal=vars['autogoal']
        if "yellowCard" in vars:
            self.yellowCard= vars['yellowCard']
        if "redCard" in vars:
            self.redCard=vars['redCard']
        if "replaced" in vars:
            self.replaced= vars ['replaced']
        if "attendance" in vars:
            self.attendance=vars['attendance']
        if "captain" in vars:
            self.captain=vars['captain']
        if "penalty" in vars: 
            self.penalty = vars['penalty']
    @staticmethod
    def createPlayerStatisticsFromXML (playerNode):
        newPlayer= PlayerStatistics(id=playerNode.get('ID'),lastName=playerNode.get('Lastname'), playedMinutes=playerNode.get('PlayedMinutes'), goal= playerNode.get('Goal'), autogoal= playerNode.get('Autogoal'), yellowCard=playerNode.get('YellowCard'), redCard=playerNode.get('RedCard'), replaced=playerNode.get('Replaced'), attendance=playerNode.get('Attendance'), captain=playerNode.get('Captain'), penalty=playerNode.get('Penalty'))
        return newPlayer

class Scorer:
    def __init__ (self,*args,**kwargs):
        vars = dict(*args, **kwargs)	
        if "teamName" in vars:
            self.teamName=vars['teamName']
        if "teamID" in vars:
            self.teamID=vars['teamID']
        if "playerID" in vars:
            self.playerID=vars['playerID']
        if "lastName" in vars:
            self.lastName=vars['lastName']
        if "firstName" in vars:
            self.firstName=vars['firstName']
        if "penaltyCount" in vars:
            self.penaltyCount=vars['penaltyCount']
        if "goalsCount" in vars:
            self.goalsCount=vars['goalsCount']

        self.scorerList=list();
        self.autoGoals = list();
    def createScorerFromXmlNode(self, root):#sesh statike, esht metod e objektit
        if root.find('ScorerStats') is None:
            return None
        for scorerStatsNode in root.find('ScorerStats'):
            for scorerNode in scorerStatsNode.iter('Scorer'):
                scorer=Scorer(teamName=scorerNode.get('TeamName'), teamID=scorerNode.get('TeamID'), playerID=scorerNode.get('PlayerID'), lastName=scorerNode.get('LastName'), firstName=scorerNode.get('FirstName'), penaltyCount= scorerNode.get('PenaltyCount'), goalsCount=scorerNode.get('GoalsCount'))
                self.scorerList.append(scorer)
        for autoGoalsStatsNode in root.find('AutoGoals'):
            for autoGoalNode in autoGoalsStatsNode.iter('AutoGoal'):
                autogoal = Goal.createGoalFromXmlNode(autoGoalsStatsNode , 0, None)
                self.autoGoals.append(autogoal)

       

