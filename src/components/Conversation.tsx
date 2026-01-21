import { Fragment, type FC } from "react";
import { Virtualizer } from "virtua";
import { MdxMessage } from "./MdxMessage";
import { useConversationStore } from "@/lib/conversationStore";
import { useShallow } from "zustand/shallow";

const UserMessageBubble: FC<{ message: string }> = ({ message }) => (
  <div className="ml-auto border border-border max-w-[80%] my-4 p-4 rounded-lg text-xs whitespace-pre-wrap bg-muted">
    <MdxMessage source={message} />
  </div>
);

const Response: FC<{ message: string }> = ({ message }) => (
  <div className="mr-auto border-t border-border w-full p-2 text-xs whitespace-pre-wrap">
    <MdxMessage source={message} />
  </div>
);

const Conversation = () => {
  const { conversation } = useConversationStore(
    useShallow((state) => ({
      conversation: state.conversation,
    })),
  );

  return (
    <Virtualizer>
      {conversation.map((part, i) => (
        // No reorder so index key is ok
        <Fragment key={i}>
          <UserMessageBubble message={part.me} />

          {part.you.length ? <Response message={part.you} /> : null}
        </Fragment>
      ))}
    </Virtualizer>
  );
};

export default Conversation;
