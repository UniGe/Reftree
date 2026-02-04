using System;
using System.Collections.Generic;
using System.Text;
using MagicEventsManager.BI.Logic;
using System.Data;
using System.Linq;

namespace MagicEventsManager.DB
{
    public class PlannedEventManager
    {
        private DB.MagicDBEntities _context { get; set; }
        public PlannedEventManager(DB.MagicDBEntities _context)
        {
            this._context = _context;
        }
        public PlannedEvents GetPlannedEvents()
        {

            PlannedEvents events = new PlannedEvents(_context.Magic_Eve_PlannedEvent.Select(e => new PlannedEvent { 
                IDPlannedEvent = e.IDPlannedEvent,
                IntervalID = e.IntervalID,
                Months = e.Magic_Eve_Interval == null ? null : e.Magic_Eve_Interval.Month,
                TsStartExecution = e.tsStartExecution,
                TsExecutionEnd = DateTime.MaxValue,
                TsLastExecution = e.tsLastExecution ?? DateTime.MaxValue,
                TsNextExecution = e.tsNextExecution ?? e.tsStartExecution,
                EventID = e.EventID,
                Duration = e.Magic_Eve_Interval == null ? 0 : (e.Magic_Eve_Interval.IntervalinSeconds ?? 0),
                Days = e.Magic_Eve_Interval == null ? null : e.Magic_Eve_Interval.DayofWeek,
                Active = e.Active
            }).ToList());
            return events;
        }
        public void UpdateActiveEvent(bool active, int idPlannedEvent)
        {
            var pe = (from e in _context.Magic_Eve_PlannedEvent where e.IDPlannedEvent == idPlannedEvent select e).FirstOrDefault();
            pe.Active = active;
            _context.SaveChanges();
        }
        public void UpdateNextExecution(DateTime tsNextExecution, int idPlannedEvent)
        {
            var pe = (from e in _context.Magic_Eve_PlannedEvent where e.IDPlannedEvent == idPlannedEvent select e).FirstOrDefault();
            pe.tsNextExecution = tsNextExecution;
            _context.SaveChanges();
        }
    }
}
