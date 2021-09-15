## How to use
### Feide username & password
Create a file `.env` like this
```
FEIDE_USERNAME=mcmcesen
FEIDE_PWD=passordet-ditt
```

### Booking times
In `days.js` you can add booking times to every day. For a specific day, simple create a list of time slots you want to book. Every time slot contains a startHourString and endHourString (see the file for example).

## Limitations
This always books E3-107, but hit a PR if you want to make it more general.