require "spec_helper"

describe Api::AisController do
  include Devise::Test::ControllerHelpers
  let(:user) { FactoryBot.create(:user) }
  let(:sequence) { FakeSequence.create(device: user.device) }

  class MockGet
    def read
      "---\n---# section\ncontent"
    end
  end

  it "makes a successful request for code" do
    sign_in user
    payload = {
      prompt: "write code",
      context_key: "lua",
      sequence_id: nil,
    }
    expect(URI).to receive(:open).exactly(15).times.and_return(MockGet.new())

    class MockPost
      def body
        {
          "choices" => [{"message" => {"content" => "return"}, "finish_reason"=> "stop"}],
        }.to_json
      end
    end
    expect(Faraday).to receive(:post).with(any_args).and_return(MockPost.new())

    post :create, body: payload.to_json
    expect(response.status).to eq(200)
    expect(response.body).to eq("return")
  end

  it "makes a successful request for summary" do
    sign_in user
    payload = {
      prompt: "summarize",
      context_key: "color",
      sequence_id: sequence.id,
    }
    expect(URI).to receive(:open).exactly(0).times

    class MockPost
      def body
        {choices: [{message: {content: "red"}, finish_reason: "stop"}]}.to_json
      end
    end
    expect(Faraday).to receive(:post).with(any_args).and_return(MockPost.new())

    post :create, body: payload.to_json
    expect(response.status).to eq(200)
    expect(response.body).to eq("red")
  end

  it "handles truncated output" do
    sign_in user
    payload = {
      prompt: "write code",
      context_key: "lua",
      sequence_id: nil,
    }
    expect(URI).to receive(:open).exactly(15).times.and_return(MockGet.new())

    class MockPost
      def body
        {
          choices: [{message: {content: "return"}, finish_reason: "length"}],
        }.to_json
      end
    end
    expect(Faraday).to receive(:post).and_return(MockPost.new())

    post :create, body: payload.to_json
    expect(response.status).to eq(403)
    expect(response.body).to eq({error: "Result length exceeded."}.to_json)
  end

  it "handles errors" do
    sign_in user
    payload = {
      prompt: "write code",
      context_key: "lua",
      sequence_id: nil,
    }
    expect(URI).to receive(:open).exactly(15).times.and_return(MockGet.new())

    class MockPost
      def body
        {error: {message: "error message"}}.to_json
      end
    end
    expect(Faraday).to receive(:post).and_return(MockPost.new())

    post :create, body: payload.to_json
    expect(response.status).to eq(403)
    expect(response.body).to eq({error: "error message"}.to_json)
  end

  it "handles connection issues" do
    sign_in user
    payload = {
      prompt: "write code",
      context_key: "lua",
      sequence_id: nil,
    }

    class MockGetError
      def read
        raise SocketError
      end
    end
    expect(URI).to receive(:open).exactly(1).times.and_return(MockGetError.new())

    class MockPost
      def body
        raise Faraday::ConnectionFailed, "error"
      end
    end
    expect(Faraday).to receive(:post).and_return(MockPost.new())

    post :create, body: payload.to_json
    expect(response.status).to eq(403)
    expect(response.body).to eq({error: "error"}.to_json)
  end

  it "throttles requests" do
    sign_in user
    payload = {
      prompt: "",
      context_key: "color",
      sequence_id: sequence.id,
    }

    class MockPost
      def body
        {choices: [{message: {content: "red"}, finish_reason: "stop"}]}.to_json
      end
    end
    expect(Faraday).to receive(:post).exactly(11).times.and_return(MockPost.new())

    [*(0..10)].map do |_|
      post :create, body: payload.to_json
      expect(response.status).to eq(200)
      expect(response.body).to eq("red")
    end

    post :create, body: payload.to_json
    expect(response.status).to eq(403)
    expect(response.body).to eq({error: "Too many requests. Try again later."}.to_json)
  end
end