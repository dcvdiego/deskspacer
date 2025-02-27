import { ModelComponentType } from '../../types/ModelTypes';

import StandingDesk1 from './desks/StandingDesk1';
import StandingDesk2 from './desks/StandingDesk2';
import Monitor32949in from './displays/Monitor32949in';
import Monitor32949inStand from './displays/Monitor32949inStand';
import Monitor329434in from './displays/Monitor329434in';
import Monitor329434inStand from './displays/Monitor329434inStand';
import Monitor21930inCurved from './displays/Monitor21930inCurved';

import Monitor219230inCurved from './displays/Monitor219230inCurved';
import Monitor21934inCurved from './displays/Monitor21934inCurved';
import Monitor219234inCurved from './displays/Monitor219234inCurved';
import Monitor21938inCurved from './displays/Monitor21938inCurved';
import Monitor219238inCurved from './displays/Monitor219238inCurved';
import Monitor1692235inCurved from './displays/Monitor1692235inCurved';
import Monitor169227inCurved from './displays/Monitor169227inCurved';
import Monitor1692315inCurved from './displays/Monitor1692315inCurved';
import Monitor16925inCurved from './displays/Monitor16925inCurved';
import Monitor16927inCurved from './displays/Monitor16927inCurved';
import Monitor169315inCurved from './displays/Monitor169315inCurved';
import Monitor16934inCurved from './displays/Monitor16934inCurved';
export const modelComponents: {
  [key: string]: {
    model: ModelComponentType;
    category: string;
    subcategory: string;
    curved?: number;
    stand?: boolean;
  };
} = {
  'Standing Desk 1': {
    model: StandingDesk1,
    category: 'desks',
    subcategory: 'Standing Desks',
  },
  'Standing Desk 2': {
    model: StandingDesk2,
    category: 'desks',
    subcategory: 'Standing Desks',
  },
  '32:9 49" Monitor': {
    model: Monitor32949in,
    category: 'displays',
    subcategory: '32:9',
    curved: 1000,
    stand: false,
  },
  '32:9 49" Monitor with stand': {
    model: Monitor32949inStand,
    category: 'displays',
    subcategory: '32:9',
    curved: 1000,
    stand: true,
  },
  '32:9 43.4" Monitor': {
    model: Monitor329434in,
    category: 'displays',
    subcategory: '32:9',
    curved: 1000, // unsure
    stand: false,
  },
  '32:9 43.4" Monitor with stand': {
    model: Monitor329434inStand,
    category: 'displays',
    subcategory: '32:9',
    curved: 1000, // unsure
    stand: true,
  },
  '21:9 30" Curved Monitor': {
    model: Monitor21930inCurved,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000, // unsure
    stand: false,
  },
  '21:9 30" Curved Monitor v2': {
    model: Monitor219230inCurved,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000, // unsure
    stand: false,
  },
  '21:9 34" Curved Monitor': {
    model: Monitor21934inCurved,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000, // unsure
    stand: false,
  },
  '21:9 34" Curved Monitor v2': {
    model: Monitor219234inCurved,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000, // unsure
    stand: false,
  },
  '21:9 38" Curved Monitor': {
    model: Monitor21938inCurved,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000, // unsure
    stand: false,
  },
  '21:9 38" Curved Monitor v2': {
    model: Monitor219238inCurved,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000, // unsure
    stand: false,
  },
  '16:9 23.5" Curved Monitor v2': {
    model: Monitor1692235inCurved,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000, //unsure
    stand: true,
  },
  '16:9 25" Curved Monitor v2': {
    model: Monitor16925inCurved,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000, //unsure
    stand: true,
  },
  '16:9 27" Curved Monitor': {
    model: Monitor16927inCurved,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000, //unsure
    stand: true,
  },
  '16:9 27" Curved Monitor v2': {
    model: Monitor169227inCurved,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000, //unsure
    stand: true,
  },
  '16:9 31.5" Curved Monitor': {
    model: Monitor169315inCurved,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000, //unsure
    stand: true,
  },
  '16:9 31.5" Curved Monitor v2': {
    model: Monitor1692315inCurved,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000, //unsure
    stand: true,
  },
  '16:9 34" Curved Monitor': {
    model: Monitor16934inCurved,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000, //unsure
    stand: true,
  },
};
