using System;
using System.Collections.Generic;
using System.Text;
using MagicEventsManager.DB;

namespace MagicEventsManager.BI.Logic
{
    public class PlannedEvent
    {
        public PlannedEvent()
        {
          
        }

        //public PlannedEvent(Magic_Eve_PlannedEvent e)
        //{
        //    this.IDPlannedEvent = e.IDPlannedEvent;
        //    this.IntervalID = e.IntervalID;
        //    this.Months = e.Magic_Eve_Interval == null ? null : e.Magic_Eve_Interval.Month;
        //    this.TsStartExecution = e.tsStartExecution;
        //    this.TsExecutionEnd = DateTime.MaxValue;
        //    this.TsLastExecution = e.tsLastExecution ?? DateTime.MaxValue;
        //    this.TsNextExecution = e.tsNextExecution ?? this.TsStartExecution;
        //    this.EventID = e.EventID;
        //    this.Duration = e.Magic_Eve_Interval == null ? 0 : (e.Magic_Eve_Interval.IntervalinSeconds ?? 0);
        //    this.Days = e.Magic_Eve_Interval == null ? null : e.Magic_Eve_Interval.DayofWeek;
        //    this.Active = e.Active;
        
        //}

        public int IDPlannedEvent { get; set; }
        public int EventID { get; set; }
        public int? IntervalID { get; set; }
        public DateTime TsStartExecution { get; set; }
        public DateTime TsLastExecution { get; set; }
        public bool Active { get; set; }
        public DateTime TsNextExecution { get; set; }
        public string Days { get; set; }
        public string Months { get; set; }
        public DateTime TsExecutionEnd { get; set; }
        public int Duration { get; set; }

        public static void UpdateNextExecution(DateTime tsNextExecution, int idPlannedEvent, DB.MagicDBEntities _context)
        {
            PlannedEventManager evPlannedMan = new PlannedEventManager(_context);
            evPlannedMan.UpdateNextExecution(tsNextExecution, idPlannedEvent);
        }

        public static void UpdateActiveEvent(bool active, int idPlannedEvent, DB.MagicDBEntities _context)
        {
            PlannedEventManager evPlannedMan = new PlannedEventManager(_context);
            evPlannedMan.UpdateActiveEvent(active, idPlannedEvent);
        }
      
    }

    public class PlannedEvents : List<PlannedEvent>
    {
        public PlannedEvents()
        { }
        public PlannedEvents(List<PlannedEvent> pevts)
        {
            foreach (var pe in pevts)
            {
                this.Add(pe);
            }
        }
        public static PlannedEvents GetEventiPianificati(DB.MagicDBEntities _context)
        {
            PlannedEventManager evPlannedMan = new PlannedEventManager(_context);
            return evPlannedMan.GetPlannedEvents();
        }
    }

}
