/* eslint-disable */
import { DateTime } from 'luxon';

/* Get the current instant */
const now = DateTime.now();

export const languages = [
    {
        id: 'b899ec30-b85a-40ab-bb1f-18a596d5c6de',
        languageCode: 'he',
        name: 'Hebrew',
        modifiedDate: now.startOf('day').minus({ day: 10 }).toISO(),
    },
    {
        id: '07986d93-d4eb-4de1-9448-2538407f7254',
        languageCode: 'el',
        name: 'Greek',
        modifiedDate: now.startOf('day').minus({ day: 10 }).toISO(),
    },
    {
        id: 'ad12aa94-3863-47f8-acab-a638ef02a3e9',
        languageCode: 'en',
        name: 'English',
        modifiedDate: now.startOf('day').minus({ day: 10 }).toISO(),
    },
    {
        id: 'ad12aa94-3863-47f8-acab-a638ef02a3e8',
        languageCode: 'my',
        name: 'Burmese',
        modifiedDate: null,
    },
    {
        id: 'ad12aa94-3863-47f8-acab-a638ef02a3e7',
        languageCode: 'th',
        name: 'Thai',
        modifiedDate: now.startOf('day').minus({ day: 10 }).toISO(),
    },
    {
        id: 'ad12aa94-3863-47f8-acab-a638ef02a3e6',
        languageCode: 'ms',
        name: 'Malay',
        modifiedDate: null,
    },
];
