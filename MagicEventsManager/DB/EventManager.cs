using System;
using System.Collections.Generic;
using System.Text;
using MagicEventsManager.BI.Logic;
using System.Data;
using System.Linq;

namespace MagicEventsManager.DB
{
    public class EventManager
    {
        private DB.MagicDBEntities _context { get; set; }
        public EventManager(DB.MagicDBEntities _context)
        {
            this._context = _context;
        }

        public Events GetEvents()
        {
            Events events = new Events(_context.Magic_Eve_Event.Select(e => new Event { 
                    EventID = e.EventID,
                    EventActionID = e.EventActionID,
                    EventScriptTypeID = e.EventScriptTypeID,
                    ScriptName = e.ScriptName,
                    Action = e.Magic_Eve_ActionType.Description,
                    ScriptType = e.Magic_Eve_ScriptType.Description,
                    SystemMessageID = e.SystemMessageID,
                    ChildEventID = e.ChildEventID
            }).ToList());
            return events;
        }

        public Event GetEvent(int EventID)
        {
            Event theevent = _context.Magic_Eve_Event.Where(x => x.EventID == EventID).Select(e => new Event
            {
                EventID = e.EventID,
                EventActionID = e.EventActionID,
                EventScriptTypeID = e.EventScriptTypeID,
                ScriptName = e.ScriptName,
                Action = e.Magic_Eve_ActionType.Description,
                ScriptType = e.Magic_Eve_ScriptType.Description,
                SystemMessageID = e.SystemMessageID,
                ChildEventID = e.ChildEventID
            }).FirstOrDefault();
            return theevent;
        }

    }
}
