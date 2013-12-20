// TODO:
// - custom probability map
// - online recalibration
// - scrolling keyboard (by head pose) 
// - support for dynamically changing page (target added/removed)
// - settings to localStorage

/*!
 *  ETU-Driver for web pages and applications
 *  
 *  @version    0.1.1
 *  @license    GNU Lesser General Public License v3, http://www.gnu.org/copyleft/lesser.html
 *  @author     Oleg Spakov, University of Tampere
 *  @created    01.11.2013
 *  @updated    20.11.2013
 *  @link       http://wwww.sis.uta.fi/~csolsp/projects.html
 *  @decsription    To create gaze-responsive interaction with a web-page objects.
 *                  Uses WebSocket to communicate with "ETU-Driver test" application which acts as a gaze data server.
 *  
 *  Usage:
 *  
 *  1. Create an HTML with elements that will be modified visually when gaze lands on them
 *  
 *  2. Create a JS file where you set the event handler and 
 *     initialize the plugin after the document content is loaded:
 *      
 *      document.addEventListener("DOMContentLoaded", function() {
 *      
 *          // Optionally, define some common settings in $.etudriver.settings, for example:
 *          $.etudriver.settings.selection.className = 'selected';
 *          
 *          // Init the library, with some settings and callbacks.
 *          //   For other majority of settings, look below for the definition of 'settings' variable 
 *          //   to learn about the available settings to customize and their default values
 *          // Note that the second argument accepts a callback as "function(event, target)" that is
 *          //   called on gaze enter and leave, and on target selection
 *          $.etudriver.init({
 *              panel: {
 *                  show: true
 *              },
 *              targets: [
 *                  {
 *                      className: 'gazeObj',
 *                      selection: {
 *                          type: $.etudriver.selection.competitiveDwell
 *                      }
 *                  },
 *                  {
 *                      className: 'gazeObj2',
 *                      selection: {
 *                          type: $.etudriver.selection.simpleDwell,
 *                          className: 'selected2',
 *                          dwellTime: 1500
 *                      },
 *                      mapping: {
 *                          className: 'focused2'
 *                      }
 *                  }
 *              ],
 *              mapping: {
 *                  type: $.etudriver.mapping.expanded,
 *                  source: $.etudriver.source.fixations,
 *              },
 *              pointer: {
 *                  show: true
 *              }
 *          }, {
 *              
 *              state: function (state) {
 *                  if (state.isStopped)
 *                      console.log('tracking stopped');
 *              },
 *          
 *              sample: function (ts, x, y, pupil, ec) {
 *                  console.log('gazeX = ' + x + ', gazeY = ' + y);
 *              }
 *          
 *          });
 *          
 *          // Set handlers for the gaze events on individual elements 
 *          //   (see $.etudriver.event for the list of events)
 *          $('#gazeButton').on($.etudriver.event.selected, function () {
 *              // the element with id 'gazeButton' has been selected
 *          });
 *      });
 *
*/

(function ($) {
    'use strict';

    if (!$) {
        $ = document;
    }
