using System;
using System.Collections.Generic;
using System.Text;
using MagicEventsManager.DB;

namespace MagicEventsManager.BI.Logic
{
    public class Event
    {
        
        public Event()
        {
            EventID = -1;
        }

        public int EventID { get; set; }
        public int EventActionID { get; set; }
        public int EventScriptTypeID { get; set; }
        public string ScriptName { get; set; }
        public string Action { get; set; }
        public string ScriptType { get; set; }
        public int? SystemMessageID { get; set; }
        public int? ChildEventID { get; set; }

        public Event(Magic_Eve_Event e)
        {
            this.EventID = e.EventID;
            this.EventActionID = e.EventActionID;
            this.EventScriptTypeID = e.EventScriptTypeID;
            this.ScriptName = e.ScriptName;
            this.Action = e.Magic_Eve_ActionType.Description;
            this.ScriptType = e.Magic_Eve_ScriptType.Description;
            this.SystemMessageID = e.SystemMessageID;
            this.ChildEventID = e.ChildEventID;
        }
    }
    
    public class Events : List<Event>
    {
        public Events(List<Event> evs)
        {
            foreach (var e in evs)
            {
                this.Add(e);
            }
        }
        public static Events GetEvents(MagicDBEntities _context)
        {
            EventManager evMan = new EventManager(_context);
            return evMan.GetEvents();
        }

        public static Event GetEvent(int EventID, MagicDBEntities _context)
        {
            EventManager evMan = new EventManager(_context);
            return evMan.GetEvent(EventID);
        }
    }
}
