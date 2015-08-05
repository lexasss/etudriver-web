/*!
 *  GazeTargets: gaze for web pages and applications
 *  
 *  @version    1.0.0
 *  @license    GNU Lesser General Public License v3, http://www.gnu.org/copyleft/lesser.html
 *  @author     Oleg Spakov, University of Tampere
 *  @created    01.11.2013
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
 *          GazeTargets.selection.settings.className = 'selected';
 *          
 *          // Init the library, with some settings and callbacks.
 *          //   For other majority of settings, look below for the definition of 'settings' variable 
 *          //   to learn about the available settings to customize and their default values
 *          // Note that the second argument accepts a callback as "function(event, target)" that is
 *          //   called on gaze enter and leave, and on target selection
 *          GazeTargets.init({
 *              panel: {
 *                  show: true
 *              },
 *              targets: [
 *                  {
 *                      className: 'gazeObj',
 *                      selection: {
 *                          type: GazeTargets.selection.types.competitiveDwell
 *                      }
 *                  },
 *                  {
 *                      className: 'gazeObj2',
 *                      selection: {
 *                          type: GazeTargets.selection.types.simpleDwell,
 *                          className: 'selected2',
 *                          dwellTime: 1500
 *                      },
 *                      mapping: {
 *                          className: 'focused2'
 *                      }
 *                  }
 *              ],
 *              mapping: {
 *                  type: GazeTargets.mapping.types.expanded,
 *                  source: GazeTargets.mapping.sources.fixations,
 *              },
 *              pointer: {
 *                  show: true
 *              }
 *          }, 
 *          {
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
 *          $('#gazeButton').on(GazeTargets.events.selected, function () {
 *              console.log('the element with id "gazeButton" has been selected');
 *          });
 *      });
 *
*/
