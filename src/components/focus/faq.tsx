import { RichText } from '@/components/common/rich-text';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { en, es, type Locale } from '@/i18n/messages';

const wcagFocusVisibleHref = 'https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html';

interface Props {
  locale: Locale;
}

interface AnswerProps {
  text: string;
  linkText: string;
}

function Answer({ text, linkText }: AnswerProps) {
  const criterionIndex = linkText === '' ? -1 : text.indexOf(linkText);

  if (criterionIndex === -1) return <RichText text={text} />;

  return (
    <>
      <RichText text={text.slice(0, criterionIndex)} />
      <a href={wcagFocusVisibleHref}>{linkText}</a>
      <RichText text={text.slice(criterionIndex + linkText.length)} />
    </>
  );
}

export function FAQ({ locale }: Props) {
  const items = (locale === 'en' ? en : es).sections.objections.items;

  return (
    <Accordion className="group/faq w-full" data-faq="" multiple>
      {items.map(({ question, answer, answerLink }, index) => (
        <AccordionItem
          className="border-b border-border"
          key={question}
          value={`question-${index + 1}`}
        >
          <AccordionTrigger
            className="w-full py-4.5 text-left font-sans faq-trigger-type font-semibold group-data-[activation=keyboard]/faq:transition-none motion-reduce:transition-none"
            onPointerDown={(event) => {
              event.currentTarget.closest('[data-faq]')?.setAttribute('data-activation', 'pointer');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.currentTarget
                  .closest('[data-faq]')
                  ?.setAttribute('data-activation', 'keyboard');
              }
            }}
          >
            {question}
          </AccordionTrigger>
          <AccordionContent className="max-w-prose pb-5 faq-answer-type">
            <p className="m-0">
              <Answer text={answer} linkText={answerLink} />
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
