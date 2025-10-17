# TODO

## Research
Now I need to make this possible:
- Add cost for event, maybe just have a 'Price: $350.00 | $350' somewhere in the description that the schedule page will understand
- Register for event (lesson / camp)
 - For each event, in 'List' view:
  - View Details button should now be a 'Register' button, which takes the user to a registration page for this event
  - Registration page should show the event details and below a form that collects:
   - Player first and last name
   - Currently level of play
   - Permission to do small group session or keep it private (for lesson event only, not camp)
   - Parents email
   - Specific hockey requests
   - Would you like to be notified of future camps and lesson availability [checkbox]
   - Stripe checkout process (let me know what steps I need to do here, I do have a stripe account)
    - When a user cancels the stripe checkout, make the cancel page say whatever it needs to, and have a CTA taking them back to schedule page
    - When a user succeeds the stripe checkout, on the success page play confetti on the left and right of the section and say congrats, you've signed up for <event> name, see you soon! Something like that. If users needs to refund, then they need to Contact Coach will, and will do so via contact page.
    - After the successful payment/registration:
     - send an email to coachwill@newerahockeytraining.com that registrants information (all fields from the form) has signed up for event <name>
     - send an email to the registrant that they've successfully signed up for <event> name. Provide all the event information in here as well, and add the cancelation policy link (so link the Terms and Conditions page)
  - Add a section underneath or somewhere that has the link to the Waiver page inside of registration
- Each Camp or Lesson has a player limit, so only x amount of people can sign up for the event
 - We need to somehow be able to figure out how we can make the google calendar track registration
 - We also need to display when the camp is SOLD OUT, we don't ever show the number how many users have registered
 - For when the event is SOLD OUT
  - For camps, keep the event visible but have "SOLD OUT" label
  - For lessons, hide the event when sold out