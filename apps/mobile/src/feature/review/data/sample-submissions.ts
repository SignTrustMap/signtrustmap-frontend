const stopSignImage = require('@/assets/images/smaple_signs/stop_sign.webp');

export type ReviewSubmission = {
  captured: string;
  id: string;
  image: number;
  location: string;
  surveyorId: string;
  title: string;
};

export const sampleReviewSubmissions: ReviewSubmission[] = [
  {
    captured: '10:42 AM Today',
    id: 'review-01',
    image: stopSignImage,
    location: 'Junction 4, West Broadway St.',
    surveyorId: 'SRV-8924',
    title: 'Stop Sign',
  },
  {
    captured: '10:36 AM Today',
    id: 'review-02',
    image: stopSignImage,
    location: 'Pham Ngu Lao & De Tham St.',
    surveyorId: 'SRV-6741',
    title: 'Stop Sign',
  },
  {
    captured: '10:18 AM Today',
    id: 'review-03',
    image: stopSignImage,
    location: 'Le Loi & Pasteur St.',
    surveyorId: 'SRV-3108',
    title: 'Stop Sign',
  },
  {
    captured: '9:57 AM Today',
    id: 'review-04',
    image: stopSignImage,
    location: 'Nguyen Hue & Ton Duc Thang St.',
    surveyorId: 'SRV-5562',
    title: 'Stop Sign',
  },
];
