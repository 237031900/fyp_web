import {
  AudioOutlined,
  CustomerServiceTwoTone,
  DeleteOutlined,
  RadarChartOutlined,
  SunOutlined,
  UploadOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";
import {
  Button,
  Flex,
  Progress,
  Image,
  Typography,
  Upload,
  UploadProps,
  notification,
  Space,
  Grid,
  Spin,
  Descriptions,
  InputNumber,
} from "antd";
import _ from "lodash";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { api } from "../common/http-common";
import { VoiceRecorder } from "react-voice-recorder-player";

import type { NotificationArgsProps } from "antd";

type NotificationPlacement = NotificationArgsProps["placement"];
type NotificationType = "success" | "info" | "warning" | "error";
type TFile = {
  name?: string;
  uid?: string;
  progress?: number;
  path?: string;
};

import Anita from "../assets/image/anita.jpg";
import Jacky from "../assets/image/jacky.jpg";
import { Link } from "react-router-dom";
const modelList = [
  {
    id: 0,
    name: "Jacky",
    path: Jacky,
  },
  {
    id: 1,
    name: "Anita",
    path: Anita,
  },
];

const jackySongs = [
  {
    name: "日出時讓街燈安睡",
    path: "https://www.youtube.com/watch?v=z4f5FBSBybU",
  },
  {
    name: "這麼近那麼遠",
    path: "https://www.youtube.com/watch?v=pvRka3_7PqY",
  },
  {
    name: "又十年",
    path: "https://www.youtube.com/watch?v=XHCBKSI1ppM",
  },
];

const anitaSongs = [
  {
    name: "夕陽之歌",
    path: "https://www.youtube.com/watch?v=XnNIPXT9YvE",
  },
  {
    name: "女人心",
    path: "https://www.youtube.com/watch?v=MrOicMfOMmQ",
  },
  {
    name: "似水流年",
    path: "https://www.youtube.com/watch?v=gnYpl2Ef3f4",
  },
];

const { Title, Paragraph, Text } = Typography;

const UploadAudio = () => {
  const [noticeApi, contextHolder] = notification.useNotification();
  const [files, setFiles] = useState<TFile>({});
  const [classified, setClassified] = useState<>({});
  const [currentAudio, setCurrentAudio] = useState(null);
  const [modelSelected, setModelSelected] = useState({});
  const [isConverting, setIsConverting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const handleUpload = ({ file }) => {
    setIsUploading(true);
    const getFileObject = (progress) => {
      return {
        name: file.name,
        uid: file.uid,
        progress,
      };
    };
    axios
      .post(
        `${api.uri}/upload`,
        { file },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (event) => {
            let blobUrl = URL.createObjectURL(file);
            const newFileObj = {
              ...getFileObject(event.progress),
              blob: blobUrl,
            };
            setFiles((prev) => {
              return { ...prev, [file.uid]: newFileObj };
            });
          },
        }
      )
      .then(({ data }) => {
        const path = data.path;
        setFiles((prev) => {
          return {
            ...prev,
            [file.uid]: {
              ...prev[file.uid],
              path,
            },
          };
        });
      })
      .catch((err) => {
        openNotification("error", "bottomRight", err.message, err.code);
      })
      .finally(() => setIsUploading(false));
  };

  const handleRemove = (uid) => {
    setFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[uid];
      return newFiles;
    });
  };

  const props: UploadProps = {
    showUploadList: false,
    accept: "audio/wav",
    maxCount: 5,
    // multiple: true,
    customRequest: handleUpload,
  };

  const handleModelSelect = async (id) => {
    const convertedList = [id] in modelSelected ? modelSelected[id] : {};
    const newConvert = _.differenceBy(
      Object.keys(files),
      Object.keys(convertedList)
    );
    if (newConvert.length > 0) {
      setIsConverting(true);

      for (const uid of newConvert) {
        await convert(
          id,
          uid,
          files[uid].tran,
          files[uid].name,
          files[uid].path
        );
      }
    }
  };
  const convert = (id, uid, tran, name, path) => {
    setIsConverting(true);
    axios
      .post(
        "http://127.0.0.1:1145/wav2wav",
        {
          spk: id,
          tran: tran,
          audio_name: name,
          audio_path: path,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "blob",
        }
      )
      .then((res) => {
        if (res.data) {
          const path = URL.createObjectURL(res.data);
          const audio = {
            name,
            path,
          };
          // setOutput((prev) => {
          //   return { ...prev, [uid]: audio };
          // });
          setModelSelected((prev) => {
            return {
              ...prev,
              [id]: prev[id]
                ? [...prev[id], { [uid]: audio }]
                : [{ [uid]: audio }],
            };
          });
        }
      })
      .catch((err) => {
        openNotification("error", "bottomRight", err.message, err.code);
      })
      .finally(() => {
        setIsConverting(false);
      });
  };
  const handleClassify = async () => {
    const newClassify = _.differenceBy(
      Object.keys(files),
      Object.keys(classified)
    );
    if (newClassify.length > 0) {
      setIsConverting(true);
      for (const uid of newClassify) {
        await classify(uid, files[uid].name, files[uid].path);
      }
    }
  };

  const classify = (uid, name, path) => {
    axios
      .post(
        "http://127.0.0.1:1147/classify",
        {
          audio_path: path,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )
      .then((res) => {
        if (res.data) {
          const result = _.sortBy(_.toPairs(res.data), ([, value]) => -value);
          setClassified((prev) => {
            return {
              ...prev,
              [uid]: {
                name,
                path,
                result,
              },
            };
          });
        }
      })
      .catch((err) => {
        openNotification("error", "bottomRight", err.message, err.code);
      })
      .finally(() => {
        setIsConverting(false);
      });
  };
  const openNotification = (
    type: NotificationType,
    placement: NotificationPlacement,
    title: string,
    message: string
  ) => {
    noticeApi[type]({
      message: title,
      description: message,
      placement,
      duration: 5,
    });
  };

  const handlePlay = (tar) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    // const audio = new Audio(target);
    // console.log(audio)
    // audio.play();
    // audio.pause();
    // setCurrentAudio(audio);
  };

  const handleTran = (uid, tran) => {
    setFiles((prev) => {
      return {
        ...prev,
        [uid]: {
          ...prev[uid],
          tran,
        },
      };
    });
  };
  const onPlayStart = () => {
    const unplay = document.getElementsByClassName('waveformgraph-unplayed-graph')[0];
    const progressbar = document.getElementsByClassName('progressbar')[0];
    
    if(unplay) unplay.style.display = 'none'
    if(progressbar) progressbar.style.display = 'none'
  }

  return (
    <Flex gap={24} vertical style={{ flex: 1 }}>
      {contextHolder}
      <Spin spinning={isConverting} fullscreen />
      <Flex vertical gap={24} style={{ padding: 24 }}>
        <Flex justify="space-between">
          <Flex vertical gap={18}>
            <Title style={{ color: "#14336F" }}>Upload songs</Title>
            <Paragraph>
              upload up to{" "}
              <Text strong italic>
                five
              </Text>{" "}
              songs to start
            </Paragraph>
            <Flex gap={8} align="flex-end">
              <Upload {...props}>
                <Button
                  icon={<UploadOutlined />}
                  loading={isUploading}
                  disabled={Object.keys(files).length > 4}
                  style={{
                    backgroundColor: "#14336F",
                    color: "white",
                    opacity: Object.keys(files).length > 4 ? 0.5 : 1,
                  }}
                >
                  Browse
                </Button>
              </Upload>
              {Object.keys(files).length > 4 && (
                <Text code>You’ve reached the limit!</Text>
              )}
            </Flex>
            <Flex wrap gap={24}>
              {Object.values(files).map((file, index) => {
                return (
                  <Flex
                    key={index}
                    vertical
                    gap={12}
                    align="center"
                    style={{
                      boxShadow: "rgb(196 191 182) 8px 8px 20px 0px",
                      backgroundColor: "rgba(0,0,0,0.05)",
                      padding: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Flex
                      gap={8}
                      style={{ width: "100%", justifyContent: "space-between" }}
                    >
                      <Progress
                        type="circle"
                        size={21}
                        percent={Math.ceil(file.progress * 100)}
                      />
                      <InputNumber
                        min={-12}
                        max={12}
                        defaultValue={0}
                        onChange={(tran) => handleTran(file.uid, tran)}
                        style={{ width: "50px" }}
                      />
                      <Flex gap={8} align="center">
                        <CustomerServiceTwoTone twoToneColor="#14336F" />
                        <Text>{file.name}</Text>
                        <DeleteOutlined
                          onClick={() => handleRemove(file.uid)}
                          style={{ flexShrink: 0 }}
                        />
                      </Flex>
                    </Flex>

                    <audio controls onPlay={handlePlay}>
                      <source src={file.blob} type="audio/wav" />
                      Your browser does not support the audio element.
                    </audio>
                  </Flex>
                );
              })}
            </Flex>
          </Flex>
          <Flex vertical gap={18}>
            <Title style={{ color: "#14336F" }}>Record your voice</Title>
            <Paragraph>Try with your own voice</Paragraph>
            <VoiceRecorder
              onRecordingEnd={() => setIsRecording(true)}
              onAudioDownload={e => console.log('rrrrrrrr',e)}
              mainContainerStyle={{ boxShadow: "none", gap: 8, margin: 0 }}
              waveContainerStyle={{
                backgroundColor: "#14336F",
                backgroundImage: "unset",
                borderBottomRightRadius: 10,
                borderBottomLeftRadius: 10
              }}
              controllerContainerStyle={{
                borderTopRightRadius: 10,
                borderTopLeftRadius: 10,
                backgroundColor: "white",
              }}
              controllerStyle={{
                background: "transparent",
                backgroundImage: "unset",
                boxShadow: "none",
              }}
              uploadAudioFile={false}
              graphColor="salmon"
              graphShaded={false}
              onPlayStart={onPlayStart}
            />
          </Flex>
        </Flex>
      </Flex>

      <Flex vertical style={{ flex: 1 }}>
        <Spin spinning={Object.keys(files).length < 1} indicator={<Space />}>
          <Flex vertical gap={24} style={{ padding: 24 }}>
            <Flex vertical>
              <Title style={{ color: "#14336F" }}>Select singer</Title>
              <Paragraph>Select a target singer</Paragraph>
            </Flex>
            <Flex wrap="wrap" gap="middle">
              {modelList.map(({ id, name, path }) => (
                <Flex key={id} vertical gap={8}>
                  <Text italic strong>
                    {name}
                  </Text>
                  <Image
                    width={200}
                    height={200}
                    src={path}
                    preview={false}
                    onClick={() => handleModelSelect(id)}
                    style={{
                      borderRadius: "8px",
                      border: "solid 2px",
                      borderImage: "linear-gradient(#f6b73c, #4d9f0c) 30",
                      cursor: "pointer",
                    }}
                  />
                </Flex>
              ))}
            </Flex>
            {Object.keys(modelSelected).map((file, index) => (
              <Flex key={index} gap={16} align="center">
                <Image
                  width={50}
                  height={50}
                  src={modelList[file].path}
                  preview={false}
                  style={{
                    borderRadius: "8px",
                    border: "solid 2px",
                    borderImage: "linear-gradient(#f6b73c, #4d9f0c) 30",
                    flexGrow: 0,
                  }}
                />
                <Flex wrap gap={8}>
                  {modelSelected[file].map((songs) => {
                    return Object.values(songs).map((song, index) => (
                      <Flex key={index} vertical gap={8}>
                        <Text>{song.name}</Text>
                        <audio
                          controls
                          style={{ width: "250px", height: "40px" }}
                        >
                          <source src={song.path} type="audio/wav" />
                          Your browser does not support the audio element.
                        </audio>
                      </Flex>
                    ));
                  })}
                </Flex>
              </Flex>
            ))}
          </Flex>
          <Flex vertical gap={24} style={{ padding: 24 }}>
            <Flex vertical>
              <Title style={{ color: "#14336F" }}>Song classification</Title>
              <Paragraph>Know your type</Paragraph>
            </Flex>
            <Button
              icon={<RadarChartOutlined />}
              loading={isUploading}
              style={{
                backgroundColor: "#14336F",
                color: "white",
              }}
              onClick={handleClassify}
            >
              Get your music type!
            </Button>
            <Flex vertical gap={8}>
              {Object.values(classified).map((data, index) => (
                <Flex gap={8} key={index} vertical>
                  <Text>{data.name}</Text>
                  {data.result.map((number, index) => (
                    <Flex gap={8} key={index}>
                      <Paragraph
                        strong={index === 0}
                        italic={index === 0}
                        style={{ width: "70px", textTransform: "capitalize" }}
                      >
                        {number[0]}
                      </Paragraph>
                      <Progress
                        percent={Math.ceil(number[1] * 100)}
                        size={[250, 6]}
                      />
                    </Flex>
                  ))}
                </Flex>
              ))}
            </Flex>
            {Object.keys(modelSelected).length > 0 &&
              Object.keys(classified).length > 0 && (
                <Flex vertical>
                  <Title level={5} style={{ color: "#14336F" }}>
                    Some songs you may like...
                  </Title>
                  {0 in modelSelected &&
                    jackySongs.map((song) => (
                      <Flex vertical>
                        <Flex gap={8}>
                          <YoutubeOutlined />
                          <Link to={song.path}>
                            {song.name} - {modelList[0].name}
                          </Link>
                        </Flex>
                      </Flex>
                    ))}
                  {1 in modelSelected &&
                    anitaSongs.map((song) => (
                      <Flex vertical>
                        <Flex gap={8}>
                          <YoutubeOutlined />
                          <Link to={song.path}>
                            {song.name} - {modelList[1].name}
                          </Link>
                        </Flex>
                      </Flex>
                    ))}
                </Flex>
              )}
          </Flex>
        </Spin>
      </Flex>
    </Flex>
  );
};

export default UploadAudio;
