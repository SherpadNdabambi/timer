/**
 * @returns {Promise}
 */
function getPreviousTasks() {

   return new Promise(async (resolve) => {
      if (!user.previousTasks) {
         // fetch previous tasks list from database
         await $.post('php/getPreviousTasks.php',
            {
               user_id: user.id
            },
            (result) => {
               user.previousTasks = JSON.parse(result); // store results in user object
            }
         );
   
         // save changes to local storage
         localStorage.user = JSON.stringify(user);
      }
      resolve();
   });
}