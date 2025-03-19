docker run -d --name zookeeper -p 2181:2181 -e ALLOW_ANONYMOUS_LOGIN=yes wurstmeister/zookeeper:latest                                                                                                                                
docker run -d --name kafka -p 9092:9092 -e KAFKA_ADVERTISED_HOST_NAME=localhost -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 -e KAFKA_CREATE_TOPICS="instagram-requests:1:1,instagram-results:1:1" --net=host wurstmeister/kafka                                                                                                             

