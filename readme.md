# setup

- checkout svn repo
- install
	- Microsoft® SQL Server® 2012 Feature Pack - https://www.microsoft.com/en-us/download/details.aspx?id=35580
		- select clr types
	- MICROSOFT® REPORT VIEWER 2012 RUNTIME - https://www.microsoft.com/en-gb/download/details.aspx?id=35747

# host using iis

install https://www.microsoft.com/web/downloads/platform.aspx
- open it and search for "url rewrite" -> install it
	- if install fails use this link to install it https://www.iis.net/downloads/microsoft/url-rewrite
- type "turn windows features on or off" in start menu - check all subentries for .NET Framework 4.x (https://stackoverflow.com/a/28397440)
- "IIS_IUSRS" needs to have acces to MagicSolution folder

# change vs language

https://agirlamonggeeks.com/2019/03/10/how-to-change-language-in-visual-studio-2019-after-installation/

# docker on windows

- install wsl 2 https://docs.microsoft.com/en-us/windows/wsl/install-win10
	- when windows store does not work https://docs.microsoft.com/en-us/windows/wsl/install-manual
- install docker https://docs.docker.com/docker-for-windows/wsl/

# sql server management studio

- sql format extension https://marketplace.visualstudio.com/items?itemName=TaoKlerks.PoorMansT-SqlFormatterSSMSVSExtension
	- online formatter http://poorsql.com/
