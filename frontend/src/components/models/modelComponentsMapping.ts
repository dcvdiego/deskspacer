import { ModelComponentType } from '../../types/ModelTypes';

import Monitor169223dot5Curved from './displays/16_9_curved_monitors_no_stand/Monitor169223dot5Curved';
import Monitor169223dot5CurvedStand from './displays/16_9_curved_monitors/Monitor169223dot5CurvedStand';
import Monitor169227Curved from './displays/16_9_curved_monitors_no_stand/Monitor169227Curved';
import Monitor169227CurvedStand from './displays/16_9_curved_monitors/Monitor169227CurvedStand';
import Monitor169231dot5Curved from './displays/16_9_curved_monitors_no_stand/Monitor169231dot5Curved';
import Monitor169231dot5CurvedStand from './displays/16_9_curved_monitors/Monitor169231dot5CurvedStand';
import Monitor16925Curved from './displays/16_9_curved_monitors_no_stand/Monitor16925Curved';
import Monitor16925CurvedStand from './displays/16_9_curved_monitors/Monitor16925CurvedStand';
import Monitor16927Curved from './displays/16_9_curved_monitors_no_stand/Monitor16927Curved';
import Monitor16927CurvedStand from './displays/16_9_curved_monitors/Monitor16927CurvedStand';
import Monitor16931dot5Curved from './displays/16_9_curved_monitors_no_stand/Monitor16931dot5Curved';
import Monitor16931dot5CurvedStand from './displays/16_9_curved_monitors/Monitor16931dot5CurvedStand';
import Monitor169322 from './displays/16_9_monitors_no_stand/Monitor169322';
import Monitor169322Stand from './displays/16_9_monitors/Monitor169322Stand';
import Monitor169323 from './displays/16_9_monitors_no_stand/Monitor169323';
import Monitor169323Stand from './displays/16_9_monitors/Monitor169323Stand';
import Monitor169324 from './displays/16_9_monitors_no_stand/Monitor169324';
import Monitor169324Stand from './displays/16_9_monitors/Monitor169324Stand';
import Monitor169325 from './displays/16_9_monitors_no_stand/Monitor169325';
import Monitor169325Stand from './displays/16_9_monitors/Monitor169325Stand';
import Monitor169327 from './displays/16_9_monitors_no_stand/Monitor169327';
import Monitor169327Stand from './displays/16_9_monitors/Monitor169327Stand';
import Monitor169328 from './displays/16_9_monitors_no_stand/Monitor169328';
import Monitor169328Stand from './displays/16_9_monitors/Monitor169328Stand';
import Monitor169331dot5 from './displays/16_9_monitors_no_stand/Monitor169331dot5';
import Monitor169331dot5Stand from './displays/16_9_monitors/Monitor169331dot5Stand';
import Monitor16934Curved from './displays/16_9_curved_monitors_no_stand/Monitor16934Curved';
import Monitor16934CurvedStand from './displays/16_9_curved_monitors/Monitor16934CurvedStand';
import Monitor169443Stand from './displays/16_9_monitors/Monitor169443Stand';
import Monitor219225 from './displays/21_9_monitors_no_stand/Monitor219225';
import Monitor219225Stand from './displays/21_9_monitors/Monitor219225Stand';
import Monitor219229 from './displays/21_9_monitors_no_stand/Monitor219229';
import Monitor219229Stand from './displays/21_9_monitors/Monitor219229Stand';
import Monitor219230Curved from './displays/21_9_curved_monitors_no_stand/Monitor219230Curved';
import Monitor219230CurvedStand from './displays/21_9_curved_monitors/Monitor219230CurvedStand';
import Monitor219234 from './displays/21_9_monitors_no_stand/Monitor219234';
import Monitor219234Curved from './displays/21_9_curved_monitors_no_stand/Monitor219234Curved';
import Monitor219234CurvedStand from './displays/21_9_curved_monitors/Monitor219234CurvedStand';
import Monitor219234Stand from './displays/21_9_monitors/Monitor219234Stand';
import Monitor219238Curved from './displays/21_9_curved_monitors_no_stand/Monitor219238Curved';
import Monitor219238CurvedStand from './displays/21_9_curved_monitors/Monitor219238CurvedStand';
import Monitor21930Curved from './displays/21_9_curved_monitors_no_stand/Monitor21930Curved';
import Monitor21930CurvedStand from './displays/21_9_curved_monitors/Monitor21930CurvedStand';
import Monitor21934Curved from './displays/21_9_curved_monitors_no_stand/Monitor21934Curved';
import Monitor21934CurvedStand from './displays/21_9_curved_monitors/Monitor21934CurvedStand';
import Monitor21938Curved from './displays/21_9_curved_monitors_no_stand/Monitor21938Curved';
import Monitor21938CurvedStand from './displays/21_9_curved_monitors/Monitor21938CurvedStand';
import Monitor32943dot4Curved from './displays/32_9_monitors_no_stand/Monitor32943dot4Curved';
import Monitor32943dot4CurvedStand from './displays/32_9_monitors/Monitor32943dot4CurvedStand';
import Monitor32949Curved from './displays/32_9_monitors_no_stand/Monitor32949Curved';
import Monitor32949CurvedStand from './displays/32_9_monitors/Monitor32949CurvedStand';
import Monitortv143Stand from './displays/tv/Monitortv143Stand';
import Monitortv149Stand from './displays/tv/Monitortv149Stand';
import Monitortv155Stand from './displays/tv/Monitortv155Stand';
import Monitortv165Stand from './displays/tv/Monitortv165Stand';
import Monitortv175Stand from './displays/tv/Monitortv175Stand';
import Monitortv185Stand from './displays/tv/Monitortv185Stand';
import StandingDesk1 from './desks/Standing_Desks/StandingDesk1';
import StandingDesk2 from './desks/Standing_Desks/StandingDesk2';

export const modelComponents: {
  [key: string]: {
    model: ModelComponentType;
    category: string;
    subcategory: string;
    curved?: number;
    stand?: boolean;
    glbPath: string;
  };
} = {
  'Standing Desk 1': {
    model: StandingDesk1,
    category: 'desks',
    subcategory: 'Standing Desks',
    glbPath: '',
  },

  'Standing Desk 2': {
    model: StandingDesk2,
    category: 'desks',
    subcategory: 'Standing Desks',
    glbPath: '',
  },
  '16:9 22" Monitor v3': {
    model: Monitor169322,
    category: 'displays',
    subcategory: '16:9',
    stand: false,
    glbPath:
      '/glb/displays/16_9_monitors_no_stand/16_9_monitor_3_22in_no_stand-transformed.glb',
  },
  '16:9 22" Monitor v3 with Stand': {
    model: Monitor169322Stand,
    category: 'displays',
    subcategory: '16:9',
    stand: true,
    glbPath: '/glb/displays/16_9_monitors/16_9_monitor_3_22in-transformed.glb',
  },
  '16:9 23.5" Curved Monitor v2': {
    model: Monitor169223dot5Curved,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000,
    stand: false,
    glbPath:
      '/glb/displays/16_9_curved_monitors_no_stand/16_9_monitor_2_curved_23.5in_no_stand-transformed.glb',
  },
  '16:9 23.5" Curved Monitor v2 with Stand': {
    model: Monitor169223dot5CurvedStand,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000,
    stand: true,
    glbPath:
      '/glb/displays/16_9_curved_monitors/16_9_monitor_2_curved_23.5in-transformed.glb',
  },
  '16:9 23" Monitor v3': {
    model: Monitor169323,
    category: 'displays',
    subcategory: '16:9',
    stand: false,
    glbPath:
      '/glb/displays/16_9_monitors_no_stand/16_9_monitor_3_23in_no_stand-transformed.glb',
  },
  '16:9 23" Monitor v3 with Stand': {
    model: Monitor169323Stand,
    category: 'displays',
    subcategory: '16:9',
    stand: true,
    glbPath: '/glb/displays/16_9_monitors/16_9_monitor_3_23in-transformed.glb',
  },
  '16:9 24" Monitor v3': {
    model: Monitor169324,
    category: 'displays',
    subcategory: '16:9',
    stand: false,
    glbPath:
      '/glb/displays/16_9_monitors_no_stand/16_9_monitor_3_24in_no_stand-transformed.glb',
  },
  '16:9 24" Monitor v3 with Stand': {
    model: Monitor169324Stand,
    category: 'displays',
    subcategory: '16:9',
    stand: true,
    glbPath: '/glb/displays/16_9_monitors/16_9_monitor_3_24in-transformed.glb',
  },
  '16:9 25" Curved Monitor': {
    model: Monitor16925Curved,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000,
    stand: false,
    glbPath:
      '/glb/displays/16_9_curved_monitors_no_stand/16_9_monitor_curved_25in_no_stand-transformed.glb',
  },
  '16:9 25" Curved Monitor with Stand': {
    model: Monitor16925CurvedStand,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000,
    stand: true,
    glbPath:
      '/glb/displays/16_9_curved_monitors/16_9_monitor_curved_25in-transformed.glb',
  },
  '16:9 25" Monitor v3': {
    model: Monitor169325,
    category: 'displays',
    subcategory: '16:9',
    stand: false,
    glbPath:
      '/glb/displays/16_9_monitors_no_stand/16_9_monitor_3_25in_no_stand-transformed.glb',
  },
  '16:9 25" Monitor v3 with Stand': {
    model: Monitor169325Stand,
    category: 'displays',
    subcategory: '16:9',
    stand: true,
    glbPath: '/glb/displays/16_9_monitors/16_9_monitor_3_25in-transformed.glb',
  },
  '16:9 27" Curved Monitor': {
    model: Monitor16927Curved,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000,
    stand: false,
    glbPath:
      '/glb/displays/16_9_curved_monitors_no_stand/16_9_monitor_curved_27in_no_stand-transformed.glb',
  },
  '16:9 27" Curved Monitor v2': {
    model: Monitor169227Curved,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000,
    stand: false,
    glbPath:
      '/glb/displays/16_9_curved_monitors_no_stand/16_9_monitor_2_curved_27in_no_stand-transformed.glb',
  },
  '16:9 27" Curved Monitor v2 with Stand': {
    model: Monitor169227CurvedStand,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000,
    stand: true,
    glbPath:
      '/glb/displays/16_9_curved_monitors/16_9_monitor_2_curved_27in-transformed.glb',
  },
  '16:9 27" Curved Monitor with Stand': {
    model: Monitor16927CurvedStand,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000,
    stand: true,
    glbPath:
      '/glb/displays/16_9_curved_monitors/16_9_monitor_curved_27in-transformed.glb',
  },
  '16:9 27" Monitor v3': {
    model: Monitor169327,
    category: 'displays',
    subcategory: '16:9',
    stand: false,
    glbPath:
      '/glb/displays/16_9_monitors_no_stand/16_9_monitor_3_27in_no_stand-transformed.glb',
  },
  '16:9 27" Monitor v3 with Stand': {
    model: Monitor169327Stand,
    category: 'displays',
    subcategory: '16:9',
    stand: true,
    glbPath: '/glb/displays/16_9_monitors/16_9_monitor_3_27in-transformed.glb',
  },
  '16:9 28" Monitor v3': {
    model: Monitor169328,
    category: 'displays',
    subcategory: '16:9',
    stand: false,
    glbPath:
      '/glb/displays/16_9_monitors_no_stand/16_9_monitor_3_28in_no_stand-transformed.glb',
  },
  '16:9 28" Monitor v3 with Stand': {
    model: Monitor169328Stand,
    category: 'displays',
    subcategory: '16:9',
    stand: true,
    glbPath: '/glb/displays/16_9_monitors/16_9_monitor_3_28in-transformed.glb',
  },
  '16:9 31.5" Curved Monitor': {
    model: Monitor16931dot5Curved,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000,
    stand: false,
    glbPath:
      '/glb/displays/16_9_curved_monitors_no_stand/16_9_monitor_curved_31.5in_no_stand-transformed.glb',
  },
  '16:9 31.5" Curved Monitor v2': {
    model: Monitor169231dot5Curved,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000,
    stand: false,
    glbPath:
      '/glb/displays/16_9_curved_monitors_no_stand/16_9_monitor_2_curved_31.5in_no_stand-transformed.glb',
  },
  '16:9 31.5" Curved Monitor v2 with Stand': {
    model: Monitor169231dot5CurvedStand,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000,
    stand: true,
    glbPath:
      '/glb/displays/16_9_curved_monitors/16_9_monitor_2_curved_31.5in-transformed.glb',
  },
  '16:9 31.5" Curved Monitor with Stand': {
    model: Monitor16931dot5CurvedStand,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000,
    stand: true,
    glbPath:
      '/glb/displays/16_9_curved_monitors/16_9_monitor_curved_31.5in-transformed.glb',
  },
  '16:9 31.5" Monitor v3': {
    model: Monitor169331dot5,
    category: 'displays',
    subcategory: '16:9',
    stand: false,
    glbPath:
      '/glb/displays/16_9_monitors_no_stand/16_9_monitor_3_31.5in_no_stand-transformed.glb',
  },
  '16:9 31.5" Monitor v3 with Stand': {
    model: Monitor169331dot5Stand,
    category: 'displays',
    subcategory: '16:9',
    stand: true,
    glbPath:
      '/glb/displays/16_9_monitors/16_9_monitor_3_31.5in-transformed.glb',
  },
  '16:9 34" Curved Monitor': {
    model: Monitor16934Curved,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000,
    stand: false,
    glbPath:
      '/glb/displays/16_9_curved_monitors_no_stand/16_9_monitor_curved_34in_no_stand-transformed.glb',
  },
  '16:9 34" Curved Monitor with Stand': {
    model: Monitor16934CurvedStand,
    category: 'displays',
    subcategory: '16:9',
    curved: 1000,
    stand: true,
    glbPath:
      '/glb/displays/16_9_curved_monitors/16_9_monitor_curved_34in-transformed.glb',
  },
  '16:9 43" Monitor v4 with Stand': {
    model: Monitor169443Stand,
    category: 'displays',
    subcategory: '16:9',
    stand: true,
    glbPath: '/glb/displays/16_9_monitors/16_9_monitor_4_43in-transformed.glb',
  },
  '21:9 25" Monitor v2': {
    model: Monitor219225,
    category: 'displays',
    subcategory: '21:9',
    stand: false,
    glbPath:
      '/glb/displays/21_9_monitors_no_stand/21_9_monitor_2_25in_no_stand-transformed.glb',
  },
  '21:9 25" Monitor v2 with Stand': {
    model: Monitor219225Stand,
    category: 'displays',
    subcategory: '21:9',
    stand: true,
    glbPath: '/glb/displays/21_9_monitors/21_9_monitor_2_25in-transformed.glb',
  },
  '21:9 29" Monitor v2': {
    model: Monitor219229,
    category: 'displays',
    subcategory: '21:9',
    stand: false,
    glbPath:
      '/glb/displays/21_9_monitors_no_stand/21_9_monitor_2_29in_no_stand-transformed.glb',
  },
  '21:9 29" Monitor v2 with Stand': {
    model: Monitor219229Stand,
    category: 'displays',
    subcategory: '21:9',
    stand: true,
    glbPath: '/glb/displays/21_9_monitors/21_9_monitor_2_29in-transformed.glb',
  },
  '21:9 30" Curved Monitor': {
    model: Monitor21930Curved,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000,
    stand: false,
    glbPath:
      '/glb/displays/21_9_curved_monitors_no_stand/21_9_monitor_1_curved_30in_no_stand-transformed.glb',
  },
  '21:9 30" Curved Monitor v2': {
    model: Monitor219230Curved,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000,
    stand: false,
    glbPath:
      '/glb/displays/21_9_curved_monitors_no_stand/21_9_monitor_2_curved_30in_no_stand-transformed.glb',
  },
  '21:9 30" Curved Monitor v2 with Stand': {
    model: Monitor219230CurvedStand,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000,
    stand: true,
    glbPath:
      '/glb/displays/21_9_curved_monitors/21_9_monitor_2_curved_30in-transformed.glb',
  },
  '21:9 30" Curved Monitor with Stand': {
    model: Monitor21930CurvedStand,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000,
    stand: true,
    glbPath:
      '/glb/displays/21_9_curved_monitors/21_9_monitor_1_curved_30in-transformed.glb',
  },
  '21:9 34" Curved Monitor': {
    model: Monitor21934Curved,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000,
    stand: false,
    glbPath:
      '/glb/displays/21_9_curved_monitors_no_stand/21_9_monitor_1_curved_34in_no_stand-transformed.glb',
  },
  '21:9 34" Curved Monitor v2': {
    model: Monitor219234Curved,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000,
    stand: false,
    glbPath:
      '/glb/displays/21_9_curved_monitors_no_stand/21_9_monitor_2_curved_34in_no_stand-transformed.glb',
  },
  '21:9 34" Curved Monitor v2 with Stand': {
    model: Monitor219234CurvedStand,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000,
    stand: true,
    glbPath:
      '/glb/displays/21_9_curved_monitors/21_9_monitor_2_curved_34in-transformed.glb',
  },
  '21:9 34" Curved Monitor with Stand': {
    model: Monitor21934CurvedStand,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000,
    stand: true,
    glbPath:
      '/glb/displays/21_9_curved_monitors/21_9_monitor_1_curved_34in-transformed.glb',
  },
  '21:9 34" Monitor v2': {
    model: Monitor219234,
    category: 'displays',
    subcategory: '21:9',
    stand: false,
    glbPath:
      '/glb/displays/21_9_monitors_no_stand/21_9_monitor_2_34in_no_stand-transformed.glb',
  },
  '21:9 34" Monitor v2 with Stand': {
    model: Monitor219234Stand,
    category: 'displays',
    subcategory: '21:9',
    stand: true,
    glbPath: '/glb/displays/21_9_monitors/21_9_monitor_2_34in-transformed.glb',
  },
  '21:9 38" Curved Monitor': {
    model: Monitor21938Curved,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000,
    stand: false,
    glbPath:
      '/glb/displays/21_9_curved_monitors_no_stand/21_9_monitor_1_curved_38in_no_stand-transformed.glb',
  },
  '21:9 38" Curved Monitor v2': {
    model: Monitor219238Curved,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000,
    stand: false,
    glbPath:
      '/glb/displays/21_9_curved_monitors_no_stand/21_9_monitor_2_curved_38in_no_stand-transformed.glb',
  },
  '21:9 38" Curved Monitor v2 with Stand': {
    model: Monitor219238CurvedStand,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000,
    stand: true,
    glbPath:
      '/glb/displays/21_9_curved_monitors/21_9_monitor_2_curved_38in-transformed.glb',
  },
  '21:9 38" Curved Monitor with Stand': {
    model: Monitor21938CurvedStand,
    category: 'displays',
    subcategory: '21:9',
    curved: 1000,
    stand: true,
    glbPath:
      '/glb/displays/21_9_curved_monitors/21_9_monitor_1_curved_38in-transformed.glb',
  },
  '32:9 43.4" Curved Monitor': {
    model: Monitor32943dot4Curved,
    category: 'displays',
    subcategory: '32:9',
    curved: 1000,
    stand: false,
    glbPath:
      '/glb/displays/32_9_monitors_no_stand/32_9_monitor_curved_43.4in_no_stand-transformed.glb',
  },
  '32:9 43.4" Curved Monitor with Stand': {
    model: Monitor32943dot4CurvedStand,
    category: 'displays',
    subcategory: '32:9',
    curved: 1000,
    stand: true,
    glbPath:
      '/glb/displays/32_9_monitors/32_9_monitor_curved_43.4in-transformed.glb',
  },
  '32:9 49" Curved Monitor': {
    model: Monitor32949Curved,
    category: 'displays',
    subcategory: '32:9',
    curved: 1000,
    stand: false,
    glbPath:
      '/glb/displays/32_9_monitors_no_stand/32_9_monitor_curved_49in_no_stand-transformed.glb',
  },
  '32:9 49" Curved Monitor with Stand': {
    model: Monitor32949CurvedStand,
    category: 'displays',
    subcategory: '32:9',
    curved: 1000,
    stand: true,
    glbPath:
      '/glb/displays/32_9_monitors/32_9_monitor_curved_49in-transformed.glb',
  },
  'tv:1 43" Monitor with Stand': {
    model: Monitortv143Stand,
    category: 'displays',
    subcategory: 'tv:1',
    stand: true,
    glbPath: '/glb/displays/tv/tv_1_43in-transformed.glb',
  },
  'tv:1 49" Monitor with Stand': {
    model: Monitortv149Stand,
    category: 'displays',
    subcategory: 'tv:1',
    stand: true,
    glbPath: '/glb/displays/tv/tv_1_49in-transformed.glb',
  },
  'tv:1 55" Monitor with Stand': {
    model: Monitortv155Stand,
    category: 'displays',
    subcategory: 'tv:1',
    stand: true,
    glbPath: '/glb/displays/tv/tv_1_55in-transformed.glb',
  },
  'tv:1 65" Monitor with Stand': {
    model: Monitortv165Stand,
    category: 'displays',
    subcategory: 'tv:1',
    stand: true,
    glbPath: '/glb/displays/tv/tv_1_65in-transformed.glb',
  },
  'tv:1 75" Monitor with Stand': {
    model: Monitortv175Stand,
    category: 'displays',
    subcategory: 'tv:1',
    stand: true,
    glbPath: '/glb/displays/tv/tv_1_75in-transformed.glb',
  },
  'tv:1 85" Monitor with Stand': {
    model: Monitortv185Stand,
    category: 'displays',
    subcategory: 'tv:1',
    stand: true,
    glbPath: '/glb/displays/tv/tv_1_85in-transformed.glb',
  },
};
