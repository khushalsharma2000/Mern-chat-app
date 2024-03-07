import React, { useEffect, useState } from "react";
import { Button } from "@chakra-ui/react";
import { Box, Text } from "@chakra-ui/layout";
import { IconButton, Spinner, useToast } from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import axios from "axios";
import io from "socket.io-client";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { FormControl } from "@chakra-ui/form-control";
import Lottie from "react-lottie";
import { Input } from "@chakra-ui/input";

const ENDPOINT = "http://localhost:5000";
let socket;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [blockDetails, setBlockDetails] = useState({}); // State to store block details for each user
  const toast = useToast();
  const { selectedChat, setSelectedChat, user, notification, setNotification } = ChatState();

  const defaultOptions = {
    loop: true,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  useEffect(() => {
    // Retrieve block/unblock status from local storage on component mount
    const storedStatus = localStorage.getItem("blockStatus");
    if (storedStatus) {
      setBlockDetails(JSON.parse(storedStatus)); // Parse the stored block details from JSON
    }

    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Update local storage when block/unblock status changes
    localStorage.setItem("blockStatus", JSON.stringify(blockDetails)); // Stringify block details before storing in local storage
  }, [blockDetails]);

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);
      const { data } = await axios.get(`/api/message/${selectedChat._id}`, config);
      setMessages(data);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");
        const { data } = await axios.post("/api/message", {
          content: newMessage,
          chatId: selectedChat,
        }, config);
        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occurred!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  const deleteLatestMessage = () => {
    if (messages.length > 0) {
      const updatedMessages = [...messages];
      updatedMessages.pop();
      setMessages(updatedMessages);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message received", (newMessageReceived) => {
      if (
        !selectedChat || 
        selectedChat._id !== newMessageReceived.chat._id
      ) {
        if (!notification.includes(newMessageReceived)) {
          setNotification([newMessageReceived, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageReceived]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!istyping) {
      setIsTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && istyping) {
        socket.emit("stop typing", selectedChat._id);
        setIsTyping(false);
      }
    }, timerLength);
  };

  const handleBlockUnblock = async (userId) => {
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
  
      const data = {
        chatId: selectedChat._id,
        userId: userId,
      };
  
      if (blockDetails[userId]) {
        if (user._id === selectedChat.users[0]._id) {
          // Only allow unblocking if the current user is the one who blocked them
          await axios.put("/api/chat/block", data, config);
          setBlockDetails(prevBlockDetails => ({
            ...prevBlockDetails,
            [userId]: false
          }));
        } else {
          console.log("You don't have permission to unblock this user.");
        }
      } else {
        // Block the user
        await axios.put("/api/chat/block", data, config);
        setBlockDetails(prevBlockDetails => ({
          ...prevBlockDetails,
          [userId]: true
        }));
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
  };
  
  
  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            font color={"white"}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            d="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              d={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {selectedChat.isGroupChat ? (
              <>
                {selectedChat.chatName.toUpperCase()}
                <UpdateGroupChatModal
                  fetchMessages={fetchMessages}
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                />
              </>
            ) : (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
              </>
            )}
            <Button onClick={() => handleBlockUnblock(selectedChat.users[0]._id)} color="black">
              {blockDetails[selectedChat.users[0]._id] ? "Unblock" : "Block"} {selectedChat.users[0].name}
            </Button>
          </Text>
          <Box
            d="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E9A929"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}

            <FormControl onKeyDown={sendMessage} id="first-name" isRequired mt={3}>
              {istyping ? (
                <div>
                  <Lottie
                    options={defaultOptions}
                    width={70}
                    style={{ marginBottom: 15, marginLeft: 0 }}
                  />
                </div>
              ) : (
                <></>
              )}
              {!blockDetails[selectedChat.users[0]._id] && (
                <Input
                  variant="filled"
                  bg="white"
                  placeholder="Enter a message"
                  value={newMessage}
                  onChange={typingHandler}
                />
              )}
              <Button
                onClick={deleteLatestMessage}
                bg="blue"
                color="white"
                _hover={{ bg: "red" }}
              >
                Delete Message
              </Button>
            </FormControl>
          </Box>
        </>
      ) : (
        <Box d="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans" font color=" white">
            Select from Left to chat
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
